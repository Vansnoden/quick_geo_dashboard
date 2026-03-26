'use client';

import ReactMarkdown from 'react-markdown';

interface Props {
    title: string;
    content: string;
}

export default function MenuSection({ title, content }: Props) {
    return (
        <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <div className="prose max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    );
}
