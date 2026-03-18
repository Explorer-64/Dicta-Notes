// ui/src/components/ContactSupportForm.tsx
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import brain from "brain"; // Import the generated API client

// Define the form schema using Zod
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters.",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters.",
  }),
});

export function ContactSupportForm() {
  const [isLoading, setIsLoading] = useState(false);

  // 1. Define your form.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      console.log("Submitting contact form:", values);
      // Use the 'brain' client to call your new endpoint
      // Ensure the method name matches the function name in your Python API file
      const response = await brain.submit_contact_form(values);

      // Check if response is ok (status 2xx) before trying to parse JSON
      if (!response.ok) {
          const errorData = await response.text(); // Get error text
          console.error("API Error Response:", errorData);
          throw new Error(`Failed to submit form. Server responded with status ${response.status}.`);
      }

      const result = await response.json(); // Assuming your endpoint returns JSON like { message: "..." }
      console.log("API Success Response:", result);
      toast.success(result.message || "Message sent successfully!");
      form.reset(); // Reset form fields after successful submission
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle data-translate>Contact Support</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-translate>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your Name" data-translate {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-translate>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="your.email@example.com" data-translate {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-translate>Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Regarding..." data-translate {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel data-translate>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your issue or question here..."
                      data-translate
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full" data-translate>
              {isLoading ? <span data-translate>Sending...</span> : <span data-translate>Send Message</span>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}