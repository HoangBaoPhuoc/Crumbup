"use client";

import { useState } from "react";
import PartnerModal from "./PartnerModal";

export default function PartnerCTAButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="btn btn-dark btn-lg"
        onClick={() => setOpen(true)}
        style={{ position: "relative", zIndex: 1 }}
      >
        Đăng ký cửa hàng →
      </button>
      {open && <PartnerModal onClose={() => setOpen(false)} />}
    </>
  );
}
