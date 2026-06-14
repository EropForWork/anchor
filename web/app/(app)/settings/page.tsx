"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Loader2,
  Lock,
  RotateCw,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  changePassword,
  getApiToken,
  regenerateApiToken,
  removeProfileImage,
  revokeApiToken,
  updateProfile,
  uploadProfileImage,
} from "@/features/auth/api";
import { useAuthStore } from "@/features/auth/store";
import { usePreferencesStore } from "@/features/preferences";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import packageJson from "../../../package.json";

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const { editor: editorPrefs, setEditorPreference } = usePreferencesStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    user?.profileImage || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [shouldRemoveImage, setShouldRemoveImage] = useState(false);

  // Sync profile image preview when local state changes
  useEffect(() => {
    if (user?.profileImage && !selectedFile && !shouldRemoveImage) {
      setProfileImagePreview(user.profileImage);
    }
  }, [user?.profileImage, selectedFile, shouldRemoveImage]);

  // Sync name only when user object changes
  useEffect(() => {
    if (user?.name !== undefined && user.name !== name) {
      setName(user.name);
    }
  }, [user?.name, name]);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [isApiTokenVisible, setIsApiTokenVisible] = useState(false);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);

  const {
    data: apiTokenResponse,
    isLoading: apiTokenLoading,
    isError: apiTokenError,
  } = useQuery({
    queryKey: ["api-token"],
    queryFn: getApiToken,
    staleTime: 5 * 60 * 1000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string | null }) => {
      return updateProfile(data);
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success(t("settings.profileUpdated"));
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t("settings.profileUpdateFailed");
      toast.error(errorMessage);
    },
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      return uploadProfileImage(file);
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      if (updatedUser.profileImage) {
        setProfileImagePreview(updatedUser.profileImage);
      }
      setSelectedFile(null);
      setShouldRemoveImage(false);
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t("settings.imageUploadFailed");
      toast.error(errorMessage);
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async () => {
      return removeProfileImage();
    },
    onSuccess: async (updatedUser) => {
      setUser(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      setProfileImagePreview(null);
      setSelectedFile(null);
      setShouldRemoveImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t("settings.imageRemoveFailed");
      toast.error(errorMessage);
    },
  });

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(t("settings.selectImageFile"));
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("settings.imageTooLarge"));
        return;
      }
      setSelectedFile(file);
      setShouldRemoveImage(false);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setShouldRemoveImage(true);
    setSelectedFile(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const promises: Promise<unknown>[] = [];

    // Update name only if it changed and is not empty
    const trimmedName = name.trim();
    if (trimmedName !== (user?.name || "")) {
      promises.push(
        updateProfileMutation.mutateAsync({ name: trimmedName || null }),
      );
    }

    // Upload image if selected (takes precedence over removal)
    if (selectedFile) {
      promises.push(uploadImageMutation.mutateAsync(selectedFile));
    } else if (shouldRemoveImage && user?.profileImage) {
      // Remove image if flag is set and no new file is selected
      promises.push(removeImageMutation.mutateAsync());
    }

    // Only make API calls if there are changes
    if (promises.length > 0) {
      await Promise.all(promises);
      toast.success(t("settings.profileUpdated"));
      // Reset flags after successful save
      setShouldRemoveImage(false);
      setSelectedFile(null);
    }
  };

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success(t("settings.passwordChanged"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPasswordError("");
      setNewPasswordError("");
      setConfirmPasswordError("");
    },
    onError: (error: Error) => {
      const errorMessage = error.message || t("settings.passwordChangeFailed");

      // Map API errors to appropriate fields
      if (
        errorMessage.toLowerCase().includes("current password") ||
        errorMessage.toLowerCase().includes("incorrect")
      ) {
        setCurrentPasswordError(errorMessage);
        setNewPasswordError("");
        setConfirmPasswordError("");
      } else {
        // Generic error - could be validation or other issues
        setNewPasswordError(errorMessage);
        setCurrentPasswordError("");
        setConfirmPasswordError("");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous errors
    setCurrentPasswordError("");
    setNewPasswordError("");
    setConfirmPasswordError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError(t("auth.passwordsDoNotMatch"));
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setNewPasswordError(t("auth.passwordMinLength"));
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleCurrentPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setCurrentPassword(e.target.value);
    if (currentPasswordError) {
      setCurrentPasswordError("");
    }
  };

  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPassword(e.target.value);
    if (newPasswordError) {
      setNewPasswordError("");
    }
    if (confirmPasswordError && e.target.value === confirmPassword) {
      setConfirmPasswordError("");
    }
  };

  const handleNewPasswordBlur = () => {
    if (newPassword && newPassword.length < 8) {
      setNewPasswordError(t("auth.passwordMinLength"));
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) {
      setConfirmPasswordError("");
    }
  };

  const handleConfirmPasswordBlur = () => {
    if (confirmPassword && confirmPassword.length < 8) {
      setConfirmPasswordError(t("auth.passwordMinLength"));
    } else if (
      confirmPassword &&
      newPassword &&
      confirmPassword !== newPassword
    ) {
      setConfirmPasswordError(t("auth.passwordsDoNotMatch"));
    }
  };

  const regenerateApiTokenMutation = useMutation({
    mutationFn: regenerateApiToken,
    onSuccess: (response) => {
      queryClient.setQueryData(["api-token"], response);
      setIsApiTokenVisible(true);
      setRegenerateDialogOpen(false);
      toast.success(t("settings.apiTokenRegenerated"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.apiTokenRegenerateFailed"));
    },
  });

  const revokeApiTokenMutation = useMutation({
    mutationFn: revokeApiToken,
    onSuccess: (response) => {
      queryClient.setQueryData(["api-token"], response);
      setIsApiTokenVisible(false);
      setRevokeDialogOpen(false);
      toast.success(t("settings.apiTokenRevoked"));
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.apiTokenRevokeFailed"));
    },
  });

  const handleCopyApiToken = async () => {
    const apiToken = apiTokenResponse?.apiToken;
    if (!apiToken) {
      toast.error(t("settings.apiTokenUnavailable"));
      return;
    }

    try {
      await navigator.clipboard.writeText(apiToken);
      toast.success(t("settings.apiTokenCopied"));
    } catch {
      toast.error(t("settings.apiTokenCopyFailed"));
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() ?? "U";
  };

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-serif font-bold mb-2">
          {t("settings.title")}
        </h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {/* Profile Section */}
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{t("settings.profile")}</CardTitle>
          <CardDescription>{t("settings.profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-2">
              <Label>{t("settings.profileImage")}</Label>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage
                    src={profileImagePreview || undefined}
                    alt={user?.name ?? user?.email ?? ""}
                  />
                  <AvatarFallback className="text-lg">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleProfileImageChange}
                    className="hidden"
                    id="profile-image-input"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      {selectedFile
                        ? t("settings.changeImage")
                        : t("settings.uploadImage")}
                    </Button>
                    {(profileImagePreview || shouldRemoveImage) && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveImage}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        {t("settings.remove")}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("settings.imageHint")}
                  </p>
                </div>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("common.name")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder={t("settings.namePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 h-12 bg-background/50"
                  maxLength={100}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={
                updateProfileMutation.isPending ||
                uploadImageMutation.isPending ||
                removeImageMutation.isPending
              }
            >
              {updateProfileMutation.isPending ||
              uploadImageMutation.isPending ||
              removeImageMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.saving")}
                </>
              ) : (
                t("settings.saveProfile")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Editor Settings Section */}
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{t("settings.editor")}</CardTitle>
          <CardDescription>{t("settings.editorDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sort checklist items */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="move-checked" className="text-base font-medium">
                {t("settings.sortChecklist")}
              </Label>
              <p className="text-sm text-muted-foreground">
                {t("settings.sortChecklistDescription")}
              </p>
            </div>
            <Switch
              id="move-checked"
              checked={editorPrefs.sortChecklistItems}
              onCheckedChange={(checked) =>
                setEditorPreference("sortChecklistItems", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* API Token Section */}
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">{t("settings.apiToken")}</CardTitle>
          <CardDescription>{t("settings.apiTokenDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiTokenLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("settings.loadingApiToken")}
            </div>
          ) : apiTokenError ? (
            <p className="text-sm text-destructive">
              {t("settings.apiTokenLoadFailed")}
            </p>
          ) : apiTokenResponse?.apiToken === null ||
            apiTokenResponse?.apiToken === undefined ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t("settings.noApiToken")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => regenerateApiTokenMutation.mutate()}
                disabled={regenerateApiTokenMutation.isPending}
                className="flex items-center gap-2"
              >
                {regenerateApiTokenMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("settings.generating")}
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    {t("settings.generateApiToken")}
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="apiToken">{t("settings.token")}</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="apiToken"
                    value={
                      isApiTokenVisible
                        ? apiTokenResponse.apiToken
                        : maskToken(apiTokenResponse.apiToken)
                    }
                    readOnly
                    className="pl-10 pr-24 h-12 bg-background/50 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsApiTokenVisible((prev) => !prev)}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title={
                      isApiTokenVisible
                        ? t("settings.hideToken")
                        : t("settings.showToken")
                    }
                  >
                    {isApiTokenVisible ? (
                      <EyeOff className="h-4 w-4 opacity-40" />
                    ) : (
                      <Eye className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyApiToken}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    title={t("settings.copyToken")}
                  >
                    <Copy className="h-4 w-4 opacity-40" />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  {t("settings.regenerateHint")}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRegenerateDialogOpen(true)}
                    disabled={
                      regenerateApiTokenMutation.isPending ||
                      revokeApiTokenMutation.isPending
                    }
                    className="flex items-center gap-2"
                  >
                    <RotateCw className="h-4 w-4" />
                    {t("settings.regenerate")}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRevokeDialogOpen(true)}
                    disabled={
                      regenerateApiTokenMutation.isPending ||
                      revokeApiTokenMutation.isPending
                    }
                    className="flex items-center gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("settings.revoke")}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Regenerate API Token Confirmation */}
      <ConfirmationDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        onConfirm={() => regenerateApiTokenMutation.mutate()}
        title={t("settings.regenerateTitle")}
        description={t("settings.regenerateDescription")}
        confirmLabel={t("settings.regenerate")}
        variant="default"
        isPending={regenerateApiTokenMutation.isPending}
      />

      {/* Revoke API Token Confirmation */}
      <ConfirmationDialog
        open={revokeDialogOpen}
        onOpenChange={setRevokeDialogOpen}
        onConfirm={() => revokeApiTokenMutation.mutate()}
        title={t("settings.revokeTitle")}
        description={t("settings.revokeDescription")}
        confirmLabel={t("settings.revoke")}
        variant="destructive"
        isPending={revokeApiTokenMutation.isPending}
      />

      {/* Change Password Section */}
      <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm mb-6">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">
            {t("settings.changePassword")}
          </CardTitle>
          <CardDescription>
            {t("settings.changePasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">
                {t("settings.currentPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={isCurrentPasswordVisible ? "text" : "password"}
                  placeholder={t("settings.currentPasswordPlaceholder")}
                  value={currentPassword}
                  onChange={handleCurrentPasswordChange}
                  className={cn(
                    "pl-10 pr-10 h-12 bg-background/50",
                    currentPasswordError &&
                      "border-destructive focus:border-destructive focus:ring-destructive/20",
                  )}
                  aria-invalid={!!currentPasswordError}
                  required
                />
                {currentPassword && (
                  <button
                    type="button"
                    onClick={() =>
                      setIsCurrentPasswordVisible(!isCurrentPasswordVisible)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isCurrentPasswordVisible ? (
                      <EyeOff className="h-4 w-4 opacity-40" />
                    ) : (
                      <Eye className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                )}
              </div>
              {currentPasswordError && (
                <p className="text-xs text-destructive px-1">
                  {currentPasswordError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("settings.newPassword")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={isNewPasswordVisible ? "text" : "password"}
                  placeholder={t("settings.newPasswordPlaceholder")}
                  value={newPassword}
                  onChange={handleNewPasswordChange}
                  onBlur={handleNewPasswordBlur}
                  className={cn(
                    "pl-10 pr-10 h-12 bg-background/50",
                    newPasswordError &&
                      "border-destructive focus:border-destructive focus:ring-destructive/20",
                  )}
                  aria-invalid={!!newPasswordError}
                  required
                />
                {newPassword && (
                  <button
                    type="button"
                    onClick={() =>
                      setIsNewPasswordVisible(!isNewPasswordVisible)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isNewPasswordVisible ? (
                      <EyeOff className="h-4 w-4 opacity-40" />
                    ) : (
                      <Eye className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                )}
              </div>
              {newPasswordError ? (
                <p className="text-xs text-destructive px-1">
                  {newPasswordError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("settings.passwordHint")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t("settings.confirmNewPassword")}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  placeholder={t("settings.confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  className={cn(
                    "pl-10 pr-10 h-12 bg-background/50",
                    confirmPasswordError &&
                      "border-destructive focus:border-destructive focus:ring-destructive/20",
                  )}
                  aria-invalid={!!confirmPasswordError}
                  required
                />
                {confirmPassword && (
                  <button
                    type="button"
                    onClick={() =>
                      setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isConfirmPasswordVisible ? (
                      <EyeOff className="h-4 w-4 opacity-40" />
                    ) : (
                      <Eye className="h-4 w-4 opacity-40" />
                    )}
                  </button>
                )}
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-destructive px-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("settings.changingPassword")}
                </>
              ) : (
                t("settings.changePassword")
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* About Section */}
      <div>
        <div className="flex flex-col items-center gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5" />
            <span>
              {t("settings.version", { version: packageJson.version })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const maskToken = (token: string) => {
  if (!token) {
    return "";
  }

  if (token.length <= 8) {
    return "•".repeat(token.length);
  }

  return `${token.slice(0, 4)}${"•".repeat(token.length - 8)}${token.slice(-4)}`;
};
