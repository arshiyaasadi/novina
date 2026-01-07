"use client";

interface SplashSlideProps {
  title: string;
  showLogo?: boolean;
  projectName?: string;
  prefix?: string;
  isActive: boolean;
}

export function SplashSlide({
  title,
  showLogo = false,
  projectName,
  prefix,
  isActive,
}: SplashSlideProps) {
  return (
    <div className="flex w-full flex-col items-center justify-center gap-8 px-6">
      {showLogo && (
        <div className="flex flex-col items-center gap-4">
          {/* Logo placeholder */}
          <div className="h-20 w-20 rounded-2xl border-2 border-primary bg-card" />
          {/* Project name */}
          {projectName && (
            <h2 className="text-2xl font-bold">{projectName}</h2>
          )}
        </div>
      )}

      {prefix && (
        <h2 className="text-2xl font-bold text-foreground">{prefix}</h2>
      )}

      <p className="text-center text-lg leading-relaxed text-foreground whitespace-pre-line">
        {title}
      </p>
    </div>
  );
}

