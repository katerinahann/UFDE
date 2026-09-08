'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { contactLabels } from '@ufde/config/contact';
import { type Locale } from '@ufde/config';
import { type Dictionary, localizedPath } from '@ufde/config/messages';
const schema = z.object({
  email: z.string().trim().email().max(254),
  name: z.string().trim().max(120).optional(),
  organization: z.string().trim().max(180).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().max(5000).optional(),
  consent: z.boolean().optional(),
  acknowledgement: z.boolean().optional(),
  website: z.string().max(0).optional(),
});
type Values = z.infer<typeof schema>;
export function EnquiryForm({
  locale,
  d,
  newsletter = false,
  demo,
}: {
  locale: Locale;
  d: Dictionary['form'];
  newsletter?: boolean;
  demo: boolean;
}) {
  const l = contactLabels[locale];
  const formSchema = schema.superRefine((v, ctx) => {
    if (newsletter) {
      if (v.consent !== true)
        ctx.addIssue({ code: 'custom', path: ['consent'], message: d.invalid });
    } else {
      for (const [key, min] of [
        ['name', 2],
        ['subject', 3],
        ['message', 20],
      ] as const)
        if ((v[key]?.length || 0) < min)
          ctx.addIssue({ code: 'custom', path: [key], message: d.invalid });
    }
  });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', website: '' },
  });
  const [status, setStatus] = useState<
    'idle' | 'success' | 'pending' | 'error' | 'limited'
  >('idle');
  const id = newsletter ? 'newsletter' : 'contact';
  async function submit(values: Values) {
    setStatus('idle');
    if (demo) {
      setStatus('success');
      return;
    }
    try {
      const payload = newsletter
        ? {
            email: values.email,
            consent: values.consent,
            language: locale,
            source: 'footer',
            website: values.website,
          }
        : { ...values, locale };
      const result = await fetch(
        newsletter
          ? process.env.NEXT_PUBLIC_NEWSLETTER_ENDPOINT ||
              '/api/newsletter?action=subscribe'
          : process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || '/api/contact',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        },
      );
      if (result.status === 429) {
        setStatus('limited');
        return;
      }
      if (!result.ok) throw new Error();
      const response = await result.json();
      setStatus(newsletter && response.doubleOptIn ? 'pending' : 'success');
    } catch {
      setStatus('error');
    }
  }
  if (status === 'success' || status === 'pending')
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={22} />
        <p>
          {demo
            ? d.demoSuccess
            : status === 'pending'
              ? {
                  en: 'Request received. If eligible, check your email to confirm your subscription.',
                  fr: 'Demande reçue. Si votre adresse est éligible, consultez votre messagerie pour confirmer votre abonnement.',
                  uk: 'Запит отримано. Якщо підписка доступна, перевірте пошту для її підтвердження.',
                }[locale]
              : newsletter
                ? d.subscribed
                : d.success}
        </p>
      </div>
    );
  const field = (
    key: 'name' | 'email' | 'organization' | 'subject' | 'message',
  ) => (
    <div className="field" key={key}>
      <label htmlFor={id + '-' + key}>{newsletter ? d[key] : l[key]}</label>
      {key === 'message' ? (
        <textarea
          id={id + '-' + key}
          required
          rows={6}
          maxLength={5000}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? id + '-' + key + '-error' : undefined}
          {...register(key)}
        />
      ) : (
        <input
          id={id + '-' + key}
          required={newsletter || key !== 'organization'}
          type={key === 'email' ? 'email' : 'text'}
          autoComplete={
            key === 'name'
              ? 'name'
              : key === 'email'
                ? 'email'
                : key === 'organization'
                  ? 'organization'
                  : undefined
          }
          maxLength={
            key === 'email'
              ? 254
              : key === 'name'
                ? 120
                : key === 'subject'
                  ? 160
                  : 180
          }
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? id + '-' + key + '-error' : undefined}
          {...register(key)}
        />
      )}{' '}
      {errors[key] && (
        <p className="field-error" id={id + '-' + key + '-error'}>
          {d.invalid}
        </p>
      )}
    </div>
  );
  return (
    <form
      noValidate
      onSubmit={handleSubmit(submit)}
      className={newsletter ? 'newsletter-form' : 'contact-form'}
    >
      {demo && <p className="form-note">{d.demoNotice}</p>}
      {!newsletter && field('name')}
      {field('email')}
      {!newsletter && (
        <>
          {field('organization')}
          {field('subject')}
          {field('message')}
        </>
      )}
      <div className="honeypot" aria-hidden="true">
        <label htmlFor={id + '-website'}>Website</label>
        <input
          id={id + '-website'}
          tabIndex={-1}
          autoComplete="off"
          {...register('website')}
        />
      </div>
      {newsletter && (
        <>
          <div className="consent-field">
            <Checkbox
              id={id + '-consent'}
              checked={watch('consent') === true}
              onCheckedChange={(v) =>
                setValue('consent', v as true, { shouldValidate: true })
              }
              aria-invalid={!!errors.consent}
              className="consent-checkbox"
            />
            <label htmlFor={id + '-consent'}>
              {newsletter ? d.newsletterConsent : d.consent}{' '}
              <Link href={localizedPath(locale, '/privacy')}>{d.privacy}</Link>
            </label>
          </div>
          {errors.consent && <p className="field-error">{d.invalid}</p>}
        </>
      )}
      {!newsletter && (
        <label className="contact-ack">
          <input type="checkbox" {...register('acknowledgement')} />
          {l.ack}
        </label>
      )}
      {status === 'limited' && (
        <p role="alert" className="field-error">
          {l.limited}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="field-error">
          {d.error}
        </p>
      )}
      <button className="button gold" type="submit" disabled={isSubmitting}>
        {isSubmitting ? d.sending : newsletter ? d.subscribe : l.send}
        <ArrowRight size={17} />
      </button>
      {!newsletter && (
        <p className="contact-privacy">
          {l.privacy}{' '}
          <Link href={localizedPath(locale, '/privacy')}>{l.policy}</Link>.
        </p>
      )}
    </form>
  );
}
