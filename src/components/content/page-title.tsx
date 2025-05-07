import React from 'react'; // Import React

interface PageTitleProps {
  title: string;
}

// Memoize the component
export const PageTitle = React.memo(function PageTitle({ title }: PageTitleProps) {
  return (
    <h1 className="text-4xl font-extrabold tracking-tight text-foreground mb-6 group"> {/* Add group class here if anchors are inside */}
      {title}
    </h1>
  );
});

// Set display name for better debugging
PageTitle.displayName = 'PageTitle';
