'use client';

import { List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { MapIcon, ChartBarIcon, CircleStackIcon, DocumentIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
        { name: 'Dashboards', href: '/admin/dashboards', icon: CircleStackIcon },
        { name: 'Documentation', href: '/admin/doc', icon: DocumentIcon },
];

export default function NavLinks() {
        const pathname = usePathname();

        return (
                <List>
                        {links.map((link) => {
                                const LinkIcon = link.icon;
                                return (
                                        <ListItem
                                                key={link.name}
                                                component={Link}
                                                href={link.href}
                                                selected={pathname === link.href}
                                                sx={{
                                                        '&.Mui-selected': {
                                                                backgroundColor: 'primary.light',
                                                                color: 'primary.contrastText',
                                                        },
                                                }}
                                        >
                                                <ListItemIcon>
                                                        <LinkIcon className="w-6" />
                                                </ListItemIcon>
                                                <ListItemText primary={link.name} />
                                        </ListItem>
                                );
                        })}
                </List>
        );
}
