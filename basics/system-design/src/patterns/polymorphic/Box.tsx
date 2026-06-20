import React from 'react';

type BoxProps<T extends React.ElementType = 'div'> = {
  as?: T;
  children?: React.ReactNode;
  className?: string;
} & Omit<React.ComponentPropsWithRef<T>, 'as' | 'children' | 'className'>;

// forwardRef with a generic polymorphic component requires a cast because TypeScript
// cannot infer the generic through forwardRef's fixed signature.
function BoxInner<T extends React.ElementType = 'div'>(
  { as, children, className, ...rest }: BoxProps<T>,
  ref: React.Ref<unknown>
) {
  const Tag = (as ?? 'div') as React.ElementType;
  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}

export const Box = React.forwardRef(BoxInner) as <T extends React.ElementType = 'div'>(
  props: BoxProps<T> & { ref?: React.Ref<unknown> }
) => React.ReactElement | null;
