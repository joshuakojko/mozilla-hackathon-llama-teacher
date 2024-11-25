'use client';

import { useEffect, useRef } from 'react';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';
import { Card } from '@/components/ui/card';

const transformer = new Transformer();

interface MindmapViewProps {
  markdown: string;
}

export function MindmapView({ markdown }: MindmapViewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    
    const { root } = transformer.transform(markdown);
    const mm = Markmap.create(svgRef.current);
    mm.setData(root);
    mm.fit();
  }, [markdown]);

  return (
    <Card className="w-full h-[600px] overflow-hidden bg-white dark:bg-gray-900">
      <svg 
        ref={svgRef} 
        className="w-full h-full"
      />
    </Card>
  );
}