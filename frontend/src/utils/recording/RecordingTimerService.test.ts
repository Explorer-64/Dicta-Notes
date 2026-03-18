/**
 * Test Suite for RecordingTimerService
 * 
 * This file contains comprehensive tests for the RecordingTimerService
 * to validate all functionality before integration with existing components.
 * 
 * To run tests:
 * 1. Import this file in browser console
 * 2. Call runTimerTests()
 * 3. Check console output for results
 */

import { 
  RecordingTimerService, 
  formatDuration, 
  formatDurationLong,
  recordingTimer,
  createTimerService 
} from './RecordingTimerService';

/**
 * Test utilities
 */
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

let testResults: { name: string; passed: boolean; message: string }[] = [];

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
};

const logTest = (name: string, passed: boolean, message: string) => {
  testResults.push({ name, passed, message });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${name}: ${message}`);
};

/**
 * Test 1: Basic timer functionality
 */
const testBasicTimer = async (): Promise<void> => {
  console.log('\n📝 Running Test 1: Basic Timer Functionality');
  
  const timer = new RecordingTimerService();
  let updateCount = 0;
  let lastDuration = 0;
  
  try {
    // Test initial state
    const initialState = timer.getState();
    assert(!initialState.isRunning, 'Timer should not be running initially');
    assert(initialState.currentTime === 0, 'Initial time should be 0');
    assert(initialState.startTime === null, 'Start time should be null initially');
    
    // Subscribe to updates
    const unsubscribe = timer.subscribe((state) => {
      updateCount++;
      lastDuration = state.currentTime;
      console.log(`  Update ${updateCount}: ${state.currentTime}s, Running: ${state.isRunning}`);
    });
    
    // Start timer
    timer.start();
    assert(timer.isRunning(), 'Timer should be running after start');
    assert(timer.getStartTime() !== null, 'Start time should be set');
    
    // Wait for a few updates
    await delay(2500);
    
    // Stop timer
    timer.stop();
    assert(!timer.isRunning(), 'Timer should not be running after stop');
    assert(lastDuration >= 2, 'Should have recorded at least 2 seconds');
    assert(updateCount >= 3, 'Should have received multiple updates');
    
    unsubscribe();
    timer.destroy();
    
    logTest('Basic Timer', true, `Recorded ${lastDuration}s with ${updateCount} updates`);
  } catch (error) {
    logTest('Basic Timer', false, (error as Error).message);
    timer.destroy();
  }
};

/**
 * Test 2: External start time coordination
 */
const testExternalStartTime = async (): Promise<void> => {
  console.log('\n📝 Running Test 2: External Start Time');
  
  const timer = new RecordingTimerService();
  
  try {
    // Start with external time 3 seconds ago
    const externalStartTime = Date.now() - 3000;
    
    let capturedDuration = 0;
    const unsubscribe = timer.subscribe((state) => {
      capturedDuration = state.currentTime;
      console.log(`  External start: ${state.currentTime}s`);
    });
    
    timer.start({ externalStartTime });
    
    // Wait 1 second
    await delay(1000);
    
    const duration = timer.getDuration();
    timer.stop();
    
    assert(duration >= 3 && duration <= 5, 'Duration should be ~4 seconds (3 external + 1 waited)');
    
    unsubscribe();
    timer.destroy();
    
    logTest('External Start Time', true, `Correctly calculated ${duration}s from external start`);
  } catch (error) {
    logTest('External Start Time', false, (error as Error).message);
    timer.destroy();
  }
};

/**
 * Test 3: Pause and resume functionality
 */
const testPauseResume = async (): Promise<void> => {
  console.log('\n📝 Running Test 3: Pause/Resume');
  
  const timer = new RecordingTimerService();
  
  try {
    let phases: string[] = [];
    
    const unsubscribe = timer.subscribe((state) => {
      phases.push(`${state.currentTime}s (${state.isRunning ? 'running' : 'stopped'})`);
      console.log(`  Pause/Resume: ${state.currentTime}s, Running: ${state.isRunning}`);
    });
    
    // Start timer
    timer.start();
    await delay(1500);
    
    // Pause
    const pausedDuration = timer.getDuration();
    timer.pause();
    assert(!timer.isRunning(), 'Timer should not be running after pause');
    
    await delay(1000); // Wait while paused
    
    // Resume
    timer.resume();
    assert(timer.isRunning(), 'Timer should be running after resume');
    
    await delay(1500);
    
    const finalDuration = timer.getDuration();
    timer.stop();
    
    assert(finalDuration >= pausedDuration + 1, 'Final duration should include resumed time');
    assert(finalDuration < pausedDuration + 2.5, 'Should not include paused time');
    
    unsubscribe();
    timer.destroy();
    
    logTest('Pause/Resume', true, `Paused at ${pausedDuration}s, resumed to ${finalDuration}s`);
  } catch (error) {
    logTest('Pause/Resume', false, (error as Error).message);
    timer.destroy();
  }
};

/**
 * Test 4: Multiple subscribers
 */
const testMultipleSubscribers = async (): Promise<void> => {
  console.log('\n📝 Running Test 4: Multiple Subscribers');
  
  const timer = new RecordingTimerService();
  
  try {
    let subscriber1Count = 0;
    let subscriber2Count = 0;
    
    const unsubscribe1 = timer.subscribe(() => {
      subscriber1Count++;
    });
    
    const unsubscribe2 = timer.subscribe(() => {
      subscriber2Count++;
    });
    
    assert(timer.getSubscriberCount() === 2, 'Should have 2 subscribers');
    
    timer.start();
    await delay(1500);
    
    // Unsubscribe one
    unsubscribe1();
    assert(timer.getSubscriberCount() === 1, 'Should have 1 subscriber after unsubscribe');
    
    await delay(1000);
    timer.stop();
    
    assert(subscriber1Count >= 1, 'Subscriber 1 should have received updates');
    assert(subscriber2Count >= 2, 'Subscriber 2 should have received more updates');
    assert(subscriber2Count > subscriber1Count, 'Subscriber 2 should have more updates than 1');
    
    unsubscribe2();
    timer.destroy();
    
    logTest('Multiple Subscribers', true, `Sub1: ${subscriber1Count}, Sub2: ${subscriber2Count} updates`);
  } catch (error) {
    logTest('Multiple Subscribers', false, (error as Error).message);
    timer.destroy();
  }
};

/**
 * Test 5: Edge cases and error handling
 */
const testEdgeCases = async (): Promise<void> => {
  console.log('\n📝 Running Test 5: Edge Cases');
  
  const timer = new RecordingTimerService();
  
  try {
    // Test multiple starts
    timer.start();
    const startTime1 = timer.getStartTime();
    
    timer.start(); // Should not restart
    const startTime2 = timer.getStartTime();
    
    assert(startTime1 === startTime2, 'Multiple starts should not change start time');
    
    // Test stop when not running
    timer.stop();
    timer.stop(); // Should not error
    
    // Test pause when not running
    timer.pause(); // Should not error
    
    // Test destroy
    timer.destroy();
    
    // Operations after destroy should fail gracefully
    timer.start();
    assert(!timer.isRunning(), 'Start should fail after destroy');
    
    logTest('Edge Cases', true, 'All edge cases handled gracefully');
  } catch (error) {
    logTest('Edge Cases', false, (error as Error).message);
    timer.destroy();
  }
};

/**
 * Test 6: Format functions
 */
const testFormatFunctions = (): void => {
  console.log('\n📝 Running Test 6: Format Functions');
  
  try {
    assert(formatDuration(0) === '00:00', 'Format 0 seconds');
    assert(formatDuration(59) === '00:59', 'Format 59 seconds');
    assert(formatDuration(60) === '01:00', 'Format 60 seconds');
    assert(formatDuration(65) === '01:05', 'Format 65 seconds');
    assert(formatDuration(3661) === '61:01', 'Format 3661 seconds');
    
    assert(formatDurationLong(0) === '00:00', 'Format long 0 seconds');
    assert(formatDurationLong(59) === '00:59', 'Format long 59 seconds');
    assert(formatDurationLong(3600) === '1:00:00', 'Format long 1 hour');
    assert(formatDurationLong(3665) === '1:01:05', 'Format long 1h 1m 5s');
    
    logTest('Format Functions', true, 'All format functions work correctly');
  } catch (error) {
    logTest('Format Functions', false, (error as Error).message);
  }
};

/**
 * Test 7: Singleton instance
 */
const testSingleton = (): void => {
  console.log('\n📝 Running Test 7: Singleton Instance');
  
  try {
    assert(recordingTimer instanceof RecordingTimerService, 'Singleton should be instance of service');
    
    const newTimer = createTimerService();
    assert(newTimer !== recordingTimer, 'Created timer should be different from singleton');
    assert(newTimer instanceof RecordingTimerService, 'Created timer should be instance of service');
    
    newTimer.destroy();
    
    logTest('Singleton Instance', true, 'Singleton and factory function work correctly');
  } catch (error) {
    logTest('Singleton Instance', false, (error as Error).message);
  }
};

/**
 * Run all tests
 */
export const runTimerTests = async (): Promise<void> => {
  console.log('🧪 Starting RecordingTimerService Test Suite...');
  console.log('═'.repeat(60));
  
  testResults = [];
  
  // Run tests sequentially to avoid interference
  await testBasicTimer();
  await testExternalStartTime();
  await testPauseResume();
  await testMultipleSubscribers();
  await testEdgeCases();
  testFormatFunctions();
  testSingleton();
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('🎯 Test Results Summary:');
  
  const passed = testResults.filter(r => r.passed).length;
  const total = testResults.length;
  
  testResults.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });
  
  console.log(`\n🏆 Tests Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! RecordingTimerService is ready for integration.');
  } else {
    console.log('❌ Some tests failed. Review implementation before integration.');
  }
};

/**
 * Quick test runner for development
 */
export const quickTest = (): void => {
  console.log('⚡ Running quick RecordingTimerService test...');
  
  const timer = new RecordingTimerService();
  
  timer.subscribe((state) => {
    console.log(`⏱️  ${formatDuration(state.currentTime)} (${state.isRunning ? 'Recording' : 'Stopped'})`);
  });
  
  timer.start();
  
  setTimeout(() => {
    timer.pause();
    console.log('⏸️  Paused');
    
    setTimeout(() => {
      timer.resume();
      console.log('▶️  Resumed');
      
      setTimeout(() => {
        timer.stop();
        console.log(`🛑 Final duration: ${formatDuration(timer.getDuration())}`);
        timer.destroy();
      }, 2000);
    }, 1000);
  }, 3000);
};

// Export for manual testing
export { RecordingTimerService, formatDuration, formatDurationLong };
