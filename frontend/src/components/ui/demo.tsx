import React from 'react';
import { MenuToggle } from '@/components/ui/menu-toggle';

export default function DemoOne() {
	const [open, setOpen] = React.useState(false);

	return (
		<div className="flex min-h-screen w-full items-center justify-center">
			<MenuToggle strokeWidth={3} open={open} onOpenChange={setOpen} className="size-16" />
		</div>
	);
}
