"use client";

export function Toggle({ checked, onChange, name }: { checked: boolean; onChange: (checked: boolean) => void; name?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        // Toggle rows also toggle on click anywhere in the row — stop this
        // click from bubbling there too, or a click on the switch itself
        // would fire both handlers and cancel back to the original state.
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`flex h-[22px] w-[38px] flex-shrink-0 cursor-pointer items-center rounded-full p-[3px] transition-colors duration-150 ${
        checked ? "bg-accent" : "bg-line"
      }`}
    >
      {name && <input type="hidden" name={name} value={checked ? "on" : ""} />}
      <span
        className={`h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-150 ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
