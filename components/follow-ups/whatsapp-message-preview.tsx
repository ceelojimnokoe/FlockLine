import { WhatsAppIcon } from "@/components/members/whatsapp-button";

export function WhatsAppMessagePreview({
  recipientFirstName,
  message,
  waUrl,
  onSendClick,
}: {
  recipientFirstName: string;
  message: string;
  waUrl: string;
  onSendClick: () => void;
}) {
  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
          <WhatsAppIcon className="h-3.5 w-3.5" />
        </span>
        <p className="text-sm font-semibold text-foreground">
          Message ready for {recipientFirstName}
        </p>
      </div>
      <div className="rounded-lg rounded-tl-sm bg-white p-3 text-sm leading-relaxed text-foreground shadow-sm">
        {message}
      </div>
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSendClick}
        className="mt-3 flex min-h-tap w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1fb959]"
      >
        <WhatsAppIcon className="h-4 w-4" />
        Send on WhatsApp
      </a>
    </div>
  );
}
