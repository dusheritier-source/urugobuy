"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, X, Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { toast } from "react-hot-toast";

interface AccountDeletionProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  className?: string;
}

export function AccountDeletion({ isOpen, onClose, onConfirm, className }: AccountDeletionProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<"warning" | "confirm" | "success">("warning");

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirm();
      setStep("success");
      toast.success("Your account has been deleted");
      
      setTimeout(() => {
        onClose();
        setStep("warning");
        setConfirmText("");
      }, 3000);
    } catch (error) {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    onClose();
    setStep("warning");
    setConfirmText("");
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
      <div className="space-y-6">
        {step === "warning" && (
          <>
            <div className="flex items-center gap-4 rounded-[20px] bg-red-50 p-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle size={24} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-900">Delete Account</h3>
                <p className="mt-1 text-sm text-red-700">This action cannot be undone</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-stone-700">
              <p>Deleting your account will permanently remove:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>Your profile and personal information</li>
                <li>Order history and tracking information</li>
                <li>Wishlist and saved items</li>
                <li>Any stored payment methods</li>
                <li>Address book entries</li>
              </ul>
              <p className="font-medium text-red-600">
                All data will be permanently deleted and cannot be recovered.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-full border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 rounded-full bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Continue
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="mt-4 text-xl font-semibold text-stone-900">Confirm Account Deletion</h3>
              <p className="mt-2 text-sm text-stone-600">
                This is your final warning. Please type <span className="font-bold text-red-600">DELETE</span> to confirm.
              </p>
            </div>

            <div>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full rounded-full border-2 border-red-200 px-4 py-3 text-center text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep("warning");
                  setConfirmText("");
                }}
                disabled={isDeleting}
                className="flex-1 rounded-full border border-stone-200 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== "DELETE"}
                className="flex-1 rounded-full bg-red-600 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </>
        )}

        {step === "success" && (
          <div className="py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Check size={32} className="text-green-600" />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-stone-900">Account Deleted</h3>
            <p className="mt-2 text-sm text-stone-600">
              Your account has been permanently deleted. We're sorry to see you go.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}