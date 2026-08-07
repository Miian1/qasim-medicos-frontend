import { classNames } from '../../utils/format.js';

export function Card({ className, children, hover, ...props }) {
  return (
    <div className={classNames(hover ? 'card-hover' : 'card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon, className }) {
  return (
    <div className={classNames('flex items-start justify-between p-5 border-b border-line', className)}>
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-ink truncate">{title}</h3>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0 ml-3">{action}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={classNames('p-5', className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return <div className={classNames('px-5 py-3 border-t border-line bg-bg/50 rounded-b-lg', className)}>{children}</div>;
}

export default Card;
