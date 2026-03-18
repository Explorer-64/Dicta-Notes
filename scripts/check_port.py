#!/usr/bin/env python3
"""Check for available ports before starting the dev server."""

import socket
from typing import List

def is_port_available(port: int) -> bool:
    """Check if a port is available."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('127.0.0.1', port))
            return True
        except OSError:
            return False

def find_available_port(start_port: int = 3000, max_attempts: int = 100) -> int:
    """Find an available port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        if is_port_available(port):
            return port
    return None

if __name__ == "__main__":
    print("Checking for available ports...")
    print()
    
    # Check common ports
    common_ports = [3000, 3001, 3002, 5173, 5174, 5175, 8080, 8081]
    
    print("Port availability:")
    available_ports = []
    for port in common_ports:
        available = is_port_available(port)
        status = "✓ Available" if available else "✗ In Use"
        print(f"  Port {port}: {status}")
        if available:
            available_ports.append(port)
    
    print()
    if available_ports:
        print(f"Recommended port: {available_ports[0]}")
        print(f"\nTo use this port, update vite.config.ts:")
        print(f"  server: {{ port: {available_ports[0]}, strictPort: false }}")
    else:
        # Find any available port
        found_port = find_available_port(3000)
        if found_port:
            print(f"Found available port: {found_port}")
            print(f"\nTo use this port, update vite.config.ts:")
            print(f"  server: {{ port: {found_port}, strictPort: false }}")
        else:
            print("Could not find an available port in range 3000-3099")
