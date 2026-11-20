interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: React.ReactNode;
  children: React.ReactNode;
}

export const Popover = ({ isOpen, onClose, trigger, children }: PopoverProps) => (
  <div className="relative">
    {isOpen && <div className="fixed inset-0 z-40" onMouseDown={onClose} />}
    {trigger}
    {isOpen && children}
  </div>
);
