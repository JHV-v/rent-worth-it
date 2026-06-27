export default function ResultFooter() {
  return (
    <footer className="bg-white border-t border-outline-variant/20">
      <div className="flex flex-col md:flex-row justify-between items-center py-stack-lg px-margin-desktop w-full max-w-container-max mx-auto gap-stack-md">
        <div className="text-label-md font-headline-sm text-on-surface font-bold tracking-tight">这房值不值 · Rent Worth It</div>
        <div className="text-body-sm text-on-surface-variant text-center md:text-left">
          © 2026 这房值不值 · 帮你算算这房住得到底值不值
        </div>
        <div className="flex gap-stack-md">
          <a className="text-on-surface-variant hover:text-primary transition-colors font-label-sm" href="https://github.com/JHV-v/rent-worth-it" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a className="text-on-surface-variant hover:text-primary transition-colors font-label-sm" href="https://github.com/JHV-v/rent-worth-it/issues" target="_blank" rel="noopener noreferrer">反馈建议</a>
        </div>
      </div>
    </footer>
  )
}
