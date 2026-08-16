"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Container } from "@/components/ui/Container";
import { ActionButton } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { OfficeLocations } from "@/components/shared/OfficeLocations";

export function ContactPageContent() {
  const { t } = useLanguage();
  const [sent, setSent] = useState(false);

  return (
    <>
      <Container className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-14 pt-18 pb-24">
        <div className="flex flex-col gap-4.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {t.contactPage.eyebrow}
          </span>
          <h1 className="text-[clamp(32px,3.8vw,50px)] leading-[1.1] font-medium tracking-[-0.02em]">
            {t.contactPage.title}
          </h1>
          <p className="text-[16.5px] leading-[1.8] text-ink-2">{t.contactPage.subtitle}</p>
          <div className="mt-3 flex flex-col gap-5 border-t border-line pt-6">
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.hotlineLabel}</span>
              <span className="text-[19px] font-semibold">0946 010 818</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.emailLabel}</span>
              <span className="text-base font-medium">2sgrouprecruitment@gmail.com</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.office1Label}</span>
              <span className="text-[15px] leading-[1.6]">
                131 Đường số 1A, KDC Nam Hùng Vương, P. An Lạc, Q. Bình Tân, TP.HCM
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs tracking-[0.12em] text-ink-2 uppercase">{t.contactPage.office2Label}</span>
              <span className="text-[15px] leading-[1.6]">Số 4, Đường Mỹ Đa Tây 9, P. Ngũ Hành Sơn, TP. Đà Nẵng</span>
            </div>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="flex h-fit flex-col gap-4 rounded-card border border-line bg-card p-8"
        >
          <h2 className="text-[22px] font-semibold">{t.contactPage.formTitle}</h2>
          <p className="text-[14.5px] leading-[1.65] text-ink-2">{t.contactPage.formSubtitle}</p>
          <FormField id="contact-name" label={t.contactPage.placeholders.name} required />
          <FormField id="contact-phone" label={t.contactPage.placeholders.phone} type="tel" />
          <FormField id="contact-email" label={t.contactPage.placeholders.email} type="email" />
          <FormField id="contact-region" label={t.contactPage.placeholders.region} />
          <FormField id="contact-message" label={t.contactPage.placeholders.message} multiline />
          <ActionButton type="submit" variant="accent" className="text-center">
            {t.contactPage.submit}
          </ActionButton>
          {sent && <span className="text-center text-sm font-semibold text-accent-2">{t.contactPage.sent}</span>}
        </form>
      </Container>

      <Container className="pb-24">
        <div className="mb-6 flex max-w-[620px] flex-col gap-3.5">
          <span className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">
            {t.home.offices.eyebrow}
          </span>
          <h2 className="text-[clamp(28px,3.2vw,42px)] leading-[1.1] font-medium tracking-[-0.02em]">
            {t.home.offices.title}
          </h2>
        </div>
        <OfficeLocations />
      </Container>
    </>
  );
}
