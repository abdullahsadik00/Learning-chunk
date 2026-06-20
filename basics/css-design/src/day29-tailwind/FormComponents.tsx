import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useState, useRef, useId } from 'react';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function FieldWrapper({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1.5">{children}</div>;
}

function Label({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-slate-300 flex items-center gap-1">
      {children}
      {required && <span className="text-rose-400 text-xs">*</span>}
    </label>
  );
}

function HelperText({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'error' | 'success' }) {
  return (
    <p
      className={clsx('text-xs', {
        'text-slate-500': variant === 'default',
        'text-rose-400': variant === 'error',
        'text-emerald-400': variant === 'success',
      })}
    >
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export type InputVariant = 'default' | 'error' | 'success';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  variant?: InputVariant;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  errorMessage,
  successMessage,
  variant = 'default',
  leftAddon,
  rightAddon,
  className,
  id,
  required,
  disabled,
  ...props
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const effectiveVariant: InputVariant = errorMessage ? 'error' : successMessage ? 'success' : variant;

  const baseInput =
    'w-full bg-slate-900 text-slate-100 placeholder:text-slate-500 rounded-lg border text-sm px-3 py-2.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantInput = {
    default: 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500',
    error: 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
    success: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500',
  }[effectiveVariant];

  return (
    <FieldWrapper>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative flex items-center">
        {leftAddon && (
          <span className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {leftAddon}
          </span>
        )}
        <input
          id={inputId}
          required={required}
          disabled={disabled}
          className={twMerge(
            baseInput,
            variantInput,
            leftAddon ? 'pl-9' : '',
            rightAddon ? 'pr-9' : '',
            className
          )}
          {...props}
        />
        {rightAddon && (
          <span className="absolute right-3 text-slate-400 pointer-events-none flex items-center">
            {rightAddon}
          </span>
        )}
      </div>
      {errorMessage && <HelperText variant="error">{errorMessage}</HelperText>}
      {successMessage && !errorMessage && <HelperText variant="success">{successMessage}</HelperText>}
      {helperText && !errorMessage && !successMessage && <HelperText>{helperText}</HelperText>}
    </FieldWrapper>
  );
}

// ---------------------------------------------------------------------------
// Textarea
// ---------------------------------------------------------------------------

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  variant?: InputVariant;
}

export function Textarea({
  label,
  helperText,
  errorMessage,
  variant = 'default',
  className,
  id,
  required,
  disabled,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const effectiveVariant: InputVariant = errorMessage ? 'error' : variant;

  const variantBorder = {
    default: 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500',
    error: 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
    success: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500',
  }[effectiveVariant];

  function handleInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }

  return (
    <FieldWrapper>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <textarea
        id={inputId}
        required={required}
        disabled={disabled}
        rows={3}
        onInput={handleInput}
        className={twMerge(
          'w-full bg-slate-900 text-slate-100 placeholder:text-slate-500 rounded-lg border text-sm px-3 py-2.5 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed resize-none overflow-hidden',
          variantBorder,
          className
        )}
        {...props}
      />
      {errorMessage && <HelperText variant="error">{errorMessage}</HelperText>}
      {helperText && !errorMessage && <HelperText>{helperText}</HelperText>}
    </FieldWrapper>
  );
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({
  label,
  helperText,
  errorMessage,
  options,
  placeholder,
  className,
  id,
  required,
  disabled,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldWrapper>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <select
          id={inputId}
          required={required}
          disabled={disabled}
          className={twMerge(
            'w-full appearance-none bg-slate-900 text-slate-100 rounded-lg border text-sm px-3 py-2.5 pr-9 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed',
            errorMessage ? 'border-rose-500' : 'border-slate-700',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Custom chevron */}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
      {errorMessage && <HelperText variant="error">{errorMessage}</HelperText>}
      {helperText && !errorMessage && <HelperText>{helperText}</HelperText>}
    </FieldWrapper>
  );
}

// ---------------------------------------------------------------------------
// Checkbox
// ---------------------------------------------------------------------------

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  helperText?: string;
  errorMessage?: string;
}

export function Checkbox({ label, helperText, errorMessage, className, id, disabled, ...props }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <FieldWrapper>
      <label
        htmlFor={inputId}
        className={clsx('group flex items-start gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}
      >
        <div className="relative mt-0.5 shrink-0">
          <input
            id={inputId}
            type="checkbox"
            disabled={disabled}
            className={twMerge(
              'peer appearance-none h-4.5 w-4.5 rounded border border-slate-600 bg-slate-900 checked:bg-indigo-600 checked:border-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors cursor-pointer disabled:cursor-not-allowed',
              'h-[18px] w-[18px]',
              className
            )}
            {...props}
          />
          {/* Checkmark overlay */}
          <svg
            className="pointer-events-none absolute inset-0 h-[18px] w-[18px] opacity-0 peer-checked:opacity-100 transition-opacity text-white"
            viewBox="0 0 18 18"
            fill="none"
            aria-hidden="true"
          >
            <path d="M4 9l4 4 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{label}</span>
      </label>
      {errorMessage && <HelperText variant="error">{errorMessage}</HelperText>}
      {helperText && !errorMessage && <HelperText>{helperText}</HelperText>}
    </FieldWrapper>
  );
}

// ---------------------------------------------------------------------------
// Radio
// ---------------------------------------------------------------------------

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  name: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  helperText?: string;
  errorMessage?: string;
}

export function RadioGroup({ label, name, options, value, onChange, helperText, errorMessage }: RadioGroupProps) {
  return (
    <fieldset className="space-y-1.5">
      {label && (
        <legend className="text-sm font-medium text-slate-300 mb-2">{label}</legend>
      )}
      <div className="space-y-2">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={clsx(
              'group flex items-start gap-3 cursor-pointer',
              opt.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="relative mt-0.5 shrink-0">
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange?.(opt.value)}
                disabled={opt.disabled}
                className="peer appearance-none h-[18px] w-[18px] rounded-full border border-slate-600 bg-slate-900 checked:border-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 transition-colors cursor-pointer disabled:cursor-not-allowed"
              />
              {/* Inner dot */}
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
              </span>
            </div>
            <div>
              <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{opt.label}</span>
              {opt.description && (
                <p className="text-xs text-slate-500 mt-0.5">{opt.description}</p>
              )}
            </div>
          </label>
        ))}
      </div>
      {errorMessage && <HelperText variant="error">{errorMessage}</HelperText>}
      {helperText && !errorMessage && <HelperText>{helperText}</HelperText>}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
// Switch
// ---------------------------------------------------------------------------

export interface SwitchProps {
  label: string;
  description?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export function Switch({ label, description, checked = false, onChange, disabled, id }: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  return (
    <div className={clsx('flex items-start gap-3', disabled && 'opacity-50')}>
      <button
        id={switchId}
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={clsx(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed',
          checked ? 'bg-indigo-600' : 'bg-slate-700'
        )}
      >
        <span
          className={clsx(
            'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
      <div>
        <label htmlFor={switchId} className="text-sm font-medium text-slate-300 cursor-pointer">
          {label}
        </label>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Toast (simple, used after form submit)
// ---------------------------------------------------------------------------

interface ToastProps {
  message: string;
  onDismiss: () => void;
}

function SuccessToast({ message, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl animate-slide-up">
      <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onDismiss} className="ml-2 text-emerald-200 hover:text-white transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Account Form demo
// ---------------------------------------------------------------------------

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  bio: string;
  plan: string;
  notifications: boolean;
  terms: boolean;
}

const ROLE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Choose a role…', disabled: true },
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'manager', label: 'Product Manager' },
  { value: 'other', label: 'Other' },
];

const PLAN_OPTIONS: RadioOption[] = [
  { value: 'free', label: 'Free', description: 'Up to 3 projects, community support' },
  { value: 'pro', label: 'Pro — $12/mo', description: 'Unlimited projects, priority support' },
  { value: 'team', label: 'Team — $49/mo', description: 'Everything in Pro, team features, SSO' },
];

export function FormComponentsDemo() {
  const [values, setValues] = useState<FormValues>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: '',
    bio: '',
    plan: 'free',
    notifications: true,
    terms: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [toast, setToast] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!values.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!values.email.includes('@')) newErrors.email = 'Valid email address required';
    if (values.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!values.role) newErrors.role = 'Please select a role';
    if (!values.terms) newErrors.terms = 'You must accept the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitted(true);
    setToast(true);
    setTimeout(() => setToast(false), 4000);
  }

  function set<K extends keyof FormValues>(key: K, val: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white">Create your account</h2>
          <p className="text-sm text-slate-400 mt-1">Fill in the details below to get started.</p>
        </div>

        {submitted ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-600/20 mb-4">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Account created!</h3>
            <p className="text-slate-400 text-sm mt-1">Welcome, {values.firstName}. Check your email to verify.</p>
            <button
              onClick={() => { setSubmitted(false); setValues({ firstName: '', lastName: '', email: '', password: '', role: '', bio: '', plan: 'free', notifications: true, terms: false }); }}
              className="mt-6 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              ← Back to form
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                placeholder="Ada"
                required
                value={values.firstName}
                onChange={(e) => set('firstName', e.target.value)}
                errorMessage={errors.firstName}
              />
              <Input
                label="Last name"
                placeholder="Lovelace"
                required
                value={values.lastName}
                onChange={(e) => set('lastName', e.target.value)}
                errorMessage={errors.lastName}
              />
            </div>

            {/* Email */}
            <Input
              label="Email address"
              type="email"
              placeholder="ada@example.com"
              required
              value={values.email}
              onChange={(e) => set('email', e.target.value)}
              errorMessage={errors.email}
              successMessage={values.email.includes('@') && !errors.email ? 'Looks good!' : undefined}
              leftAddon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
              }
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              required
              value={values.password}
              onChange={(e) => set('password', e.target.value)}
              errorMessage={errors.password}
              helperText="Use a mix of letters, numbers, and symbols."
            />

            {/* Role select */}
            <Select
              label="Role"
              required
              options={ROLE_OPTIONS}
              value={values.role}
              onChange={(e) => set('role', e.target.value)}
              errorMessage={errors.role}
            />

            {/* Bio */}
            <Textarea
              label="Bio"
              placeholder="Tell us a bit about yourself…"
              value={values.bio}
              onChange={(e) => set('bio', e.target.value)}
              helperText="Optional. Max 500 characters."
            />

            {/* Plan */}
            <RadioGroup
              label="Plan"
              name="plan"
              options={PLAN_OPTIONS}
              value={values.plan}
              onChange={(v) => set('plan', v)}
            />

            {/* Toggles */}
            <div className="space-y-3 pt-2 border-t border-slate-700">
              <Switch
                label="Email notifications"
                description="Receive product updates and announcements."
                checked={values.notifications}
                onChange={(v) => set('notifications', v)}
              />
            </div>

            {/* Terms */}
            <Checkbox
              label={
                <span>
                  I agree to the{' '}
                  <span className="text-indigo-400 underline underline-offset-2 cursor-pointer hover:text-indigo-300">
                    Terms of Service
                  </span>{' '}
                  and{' '}
                  <span className="text-indigo-400 underline underline-offset-2 cursor-pointer hover:text-indigo-300">
                    Privacy Policy
                  </span>
                </span>
              }
              checked={values.terms}
              onChange={(e) => set('terms', e.target.checked)}
              errorMessage={errors.terms as string | undefined}
              required
            />

            {/* Submit */}
            <button
              type="submit"
              className="w-full h-10 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Create account
            </button>
          </form>
        )}
      </div>

      {toast && (
        <SuccessToast
          message="Account created successfully!"
          onDismiss={() => setToast(false)}
        />
      )}
    </div>
  );
}
