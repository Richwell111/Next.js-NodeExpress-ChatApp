"use client";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPatch } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Show } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, User, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useApi } from "@/hooks/use-api";

/**
 * Validation schema helper for optional text fields.
 * It trims whitespace and converts empty strings to undefined.
 */
const optionalText = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value === "" ? undefined : value))
  .optional();

/**
 * Main Profile Validation Schema.
 * Defines constraints for each field and provides human-readable error messages.
 */
const ProfileSchema = z.object({
  displayName: optionalText.pipe(z.string().max(50, "Name cannot exceed 50 characters").optional()),
  handle: optionalText.pipe(
    z.string()
      .max(30, "Handle cannot exceed 30 characters")
      .regex(/^[a-zA-Z0-9_]*$/, "Handle can only contain letters, numbers, and underscores")
      .optional()
  ),
  bio: optionalText.pipe(z.string().max(500, "Bio cannot exceed 500 characters").optional()),
  avatarUrl: optionalText.pipe(
    z.string().url("Please enter a valid URL").or(z.literal("")).optional()
  ),
});

type ProfileFormValues = z.infer<typeof ProfileSchema>;

type UserResponse = {
  id: number;
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
  handle: string | null;
  avatarUrl: string | null;
  bio: string | null;
};

/**
 * ProfilePage Component
 * Allows users to view and update their profile information.
 */
export default function ProfilePage() {
  const apiClient = useApi();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: {
      displayName: "",
      handle: "",
      bio: "",
      avatarUrl: "",
    },
  });

  // Extract dirty state and errors from the form
  const { isDirty, errors } = form.formState;

  /**
   * Effect: Load the user's current profile on component mount.
   */
  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        setIsLoading(true);
        const userInfo = await apiGet<UserResponse>(apiClient, "/api/me");

        if (!isMounted) return;

        // Populate the form with current backend data
        form.reset({
          displayName: userInfo.displayName ?? "",
          handle: userInfo.handle ?? "",
          bio: userInfo.bio ?? "",
          avatarUrl: userInfo.avatarUrl ?? "",
        });
      } catch (err) {
        console.error("Failed to load profile:", err);
        toast.error("Failed to load profile information.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [apiClient, form]);

  /**
   * Handler: Form submission to update the profile.
   */
  async function onSubmit(values: ProfileFormValues) {
    try {
      setIsSaving(true);

      // Construct and clean the payload
      const payload: Partial<ProfileFormValues> = {
        ...values,
        handle: values.handle?.toLowerCase(), // Normalize handles to lowercase
      };

      const updatedUser = await apiPatch<typeof payload, UserResponse>(
        apiClient,
        "/api/me",
        payload
      );

      // Re-reset the form with updated data to clear the 'isDirty' state
      form.reset({
        displayName: updatedUser.displayName ?? "",
        handle: updatedUser.handle ?? "",
        bio: updatedUser.bio ?? "",
        avatarUrl: updatedUser.avatarUrl ?? "",
      });

      toast.success("Profile updated successfully!");
    } catch (err: any) {
      console.error("Update error:", err);
      // Try to extract a specific error message from the backend response
      const message = err.response?.data?.message || "Failed to save profile changes.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  }

  // Real-time watchers for the UI preview
  const displayNameValue = form.watch("displayName");
  const handleValue = form.watch("handle");
  const avatarUrlValue = form.watch("avatarUrl");

  return (
    <>
      <Show when="signed-out">
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground">You need to be signed in to manage your profile.</p>
        </div>
      </Show>

      <Show when="signed-in">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
          <header>
            <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-foreground">
              <User className="h-8 w-8 text-primary" />
              Profile Settings
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your personal details and public presence.
            </p>
          </header>

          {/* Profile Appearance Preview */}
          <Card className="border-border/70 bg-card/50">
            <CardHeader className="pb-4">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20 ring-2 ring-primary/10 transition-all">
                  <AvatarImage
                    src={avatarUrlValue || ""}
                    alt={displayNameValue ?? "Profile"}
                  />
                  {/* Avatar Fallback would go here */}
                </Avatar>

                <div className="flex-1">
                  <CardTitle className="text-2xl text-foreground">
                    {displayNameValue || "Anonymous User"}
                  </CardTitle>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        handleValue
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {handleValue ? `@${handleValue.toLowerCase()}` : "@yourhandle"}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Form Content */}
          <Card className="border-border/70 bg-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Display Name Input */}
                    <div className="space-y-2">
                      <label htmlFor="displayName" className="text-sm font-semibold">
                        Display Name
                      </label>
                      <Input
                        id="displayName"
                        placeholder="John Doe"
                        {...form.register("displayName")}
                        disabled={isSaving}
                        className={cn("bg-background/60", errors.displayName && "border-destructive")}
                      />
                      {errors.displayName && (
                        <p className="text-[0.8rem] font-medium text-destructive">
                          {errors.displayName.message}
                        </p>
                      )}
                    </div>

                    {/* Handle Input */}
                    <div className="space-y-2">
                      <label htmlFor="handle" className="text-sm font-semibold">
                        Handle
                      </label>
                      <Input
                        id="handle"
                        placeholder="johndoe"
                        {...form.register("handle")}
                        disabled={isSaving}
                        className={cn("bg-background/60", errors.handle && "border-destructive")}
                      />
                      {errors.handle && (
                        <p className="text-[0.8rem] font-medium text-destructive">
                          {errors.handle.message}
                        </p>
                      )}
                    </div>

                    {/* Bio Input */}
                    <div className="col-span-full space-y-2">
                      <label htmlFor="bio" className="text-sm font-semibold">
                        Bio
                      </label>
                      <Textarea
                        id="bio"
                        placeholder="Share a bit about yourself..."
                        rows={4}
                        {...form.register("bio")}
                        disabled={isSaving}
                        className={cn("bg-background/60", errors.bio && "border-destructive")}
                      />
                      {errors.bio && (
                        <p className="text-[0.8rem] font-medium text-destructive">
                          {errors.bio.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Avatar URL Input */}
                  <div className="space-y-2">
                    <label htmlFor="avatarUrl" className="text-sm font-semibold">
                      Avatar URL
                    </label>
                    <Input
                      id="avatarUrl"
                      placeholder="https://example.com/photo.jpg"
                      {...form.register("avatarUrl")}
                      disabled={isSaving}
                      className={cn("bg-background/60", errors.avatarUrl && "border-destructive")}
                    />
                    {errors.avatarUrl && (
                      <p className="text-[0.8rem] font-medium text-destructive">
                        {errors.avatarUrl.message}
                      </p>
                    )}
                  </div>

                  <CardFooter className="px-0 pb-0">
                    <Button
                      type="submit"
                      disabled={!isDirty || isSaving}
                      className="min-w-[140px] shadow-sm"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </Show>
    </>
  );
}