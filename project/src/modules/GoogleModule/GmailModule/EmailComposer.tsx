import React, { useState, useRef } from "react";
import { IoClose } from "react-icons/io5";
import { Paperclip, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCurrentTheme } from "@/hooks/useTheme";

interface EmailComposerProps {
  mode: "reply" | "compose";
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onSend: (payload: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    body: string;
    attachments: File[];
  }) => void;
  onClose: () => void;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  mode,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  onSend,
  onClose,
}) => {
  const currentTheme = useCurrentTheme();
  const [to, setTo] = useState(initialTo);
  const [cc, setCC] = useState("");
  const [bcc, setBCC] = useState("");
  const [showCC, setShowCC] = useState(false);
  const [showBCC, setShowBCC] = useState(false);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [attachments, setAttachments] = useState<File[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const triggerFilePicker = () => fileInputRef.current?.click();

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  function send() {
    const payload = {
      to: to
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      cc: cc
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      bcc: bcc
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      subject,
      body,
      attachments,
    };

    onSend(payload);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 25 }}
      transition={{ duration: 0.22 }}
      className="absolute bottom-0 left-0 right-0 border-t border-white/5 p-4 rounded-t-2xl shadow-lg shadow-black/50 z-[500]"
      style={{ height: 380, backgroundColor: currentTheme.gmail_background_1_2 }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="text-[13px] text-white/70">
          {mode === "reply" ? "Reply" : "New Message"}
        </div>

        <button
          onClick={onClose}
          style={{ backgroundColor: currentTheme.gmail_button_1 }}
          className="w-[27px] h-[27px] rounded-full flex items-center justify-center hover:brightness-85 cursor-pointer dim"
        >
          <IoClose />
        </button>
      </div>

      {/* Compose fields */}
      <div className="flex flex-col gap-2">
        {/* TO */}
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="To"
          style={{ backgroundColor: currentTheme.gmail_button_1 }}
          className="text-[13px] px-3 py-2 rounded-lg outline-none border border-white/5"
        />

        {/* CC / BCC toggles */}
        <div className="flex gap-3 text-[12px] text-white/50 opacity-[0.5]">
          <button
            onClick={() => setShowCC((p) => !p)}
            className="cursor-pointer hover:brightness-85 dim flex flex-row items-center gap-[4px]"
          >
            <span>cc</span>
            {!showCC ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
          <button
            onClick={() => setShowBCC((p) => !p)}
            className="cursor-pointer hover:brightness-85 dim flex flex-row items-center gap-[4px]"
          >
            <span>bcc</span>{" "}
            {!showBCC ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showCC && (
            <motion.input
              key="cc"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              value={cc}
              onChange={(e) => setCC(e.target.value)}
              placeholder="CC"
              style={{ backgroundColor: currentTheme.gmail_button_1 }}
              className="text-[13px] px-3 py-2 rounded-lg outline-none border border-white/5"
            />
          )}

          {showBCC && (
            <motion.input
              key="bcc"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              value={bcc}
              onChange={(e) => setBCC(e.target.value)}
              placeholder="BCC"
              style={{ backgroundColor: currentTheme.gmail_button_1 }}
              className="text-[13px] px-3 py-2 rounded-lg outline-none border border-white/5"
            />
          )}
        </AnimatePresence>

        {/* SUBJECT (only in compose mode) */}
        {mode === "compose" && (
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            style={{ backgroundColor: currentTheme.gmail_button_1 }}
            className="text-[13px] px-3 py-2 rounded-lg outline-none border border-white/5"
          />
        )}

        {/* BODY */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            mode === "reply" ? "Type your reply…" : "Write your message…"
          }
          rows={6}
          style={{ backgroundColor: currentTheme.gmail_button_1 }}
          className="text-[13px] p-3 rounded-lg outline-none border border-white/5 flex-1 resize-none "
        />

        {/* Attachments */}
        <div className="flex items-center justify-between mt-1">
          <button
            onClick={triggerFilePicker}
            style={{ backgroundColor: currentTheme.gmail_button_1 }}
            className="cursor-pointer hover:brightness-85 dim text-[13px] pr-[16px] pl-[10px] py-[7px] rounded-lg flex items-center gap-[6px]"
          >
            <Plus size={14} />
            <span>Add attachment</span>
          </button>

          {/* Hidden input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAddAttachment}
            multiple
            hidden
          />

          <div className="flex gap-2 flex-wrap max-w-[70%]">
            {attachments.map((f, i) => (
              <div
                key={i}
                style={{ backgroundColor: currentTheme.gmail_button_1 }}
                className="text-[11px] px-2 py-1 rounded-md flex items-center gap-1"
              >
                <Paperclip size={12} />
                {f.name}
              </div>
            ))}
          </div>

          {/* Send button */}
          <div className="flex justify-end">
            <button
              onClick={send}
              style={{ backgroundColor: currentTheme.gmail_button_1 }}
              className="cursor-pointer dim text-[13px] px-[16px] py-[7px] rounded-lg hover:brightness-85"
            >
              {mode === "reply" ? "Send Reply" : "Send Email"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailComposer;
