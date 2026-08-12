"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export function ModalDemo({ dir }: { dir: "ltr" | "rtl" }) {
  const [open, setOpen] = useState(false);
  const ar = dir === "rtl";

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        {ar ? "افتح النافذة" : "Open modal"}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        dir={dir}
        title={ar ? "احجز عرضًا تجريبيًا" : "Book a Demo"}
        closeLabel={ar ? "إغلاق" : "Close"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={() => setOpen(false)}>
              {ar ? "تأكيد" : "Confirm"}
            </Button>
          </>
        }
      >
        {ar
          ? "سنتواصل معك خلال يوم عمل واحد لتحديد موعد يناسبك."
          : "We'll reach out within one business day to find a time that works for you."}
      </Modal>
    </>
  );
}
