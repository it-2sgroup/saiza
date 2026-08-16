type FormFieldProps = {
  id: string;
  label: string;
  type?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
};

const fieldClasses =
  "rounded-xl border border-line bg-paper px-4 py-3.5 text-[15px] text-ink outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30";

export function FormField({ id, label, type = "text", required, multiline, rows = 4 }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs tracking-[0.12em] text-ink-2 uppercase">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} name={id} rows={rows} required={required} className={`resize-y ${fieldClasses}`} />
      ) : (
        <input id={id} name={id} type={type} required={required} className={fieldClasses} />
      )}
    </div>
  );
}
