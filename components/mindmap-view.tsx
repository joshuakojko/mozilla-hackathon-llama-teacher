import { useEffect, useRef } from 'react'
import { Transformer } from 'markmap-lib'
import { Markmap } from 'markmap-view'

interface MarkmapProps {
  markdown: string
}

export function MarkmapComponent({ markdown }: MarkmapProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (svgRef.current) {
      const transformer = new Transformer()
      const { root } = transformer.transform(markdown)
      Markmap.create(svgRef.current, undefined, root)
    }
  }, [markdown])

  return (
    <div className="w-full h-[400px] bg-background rounded-lg shadow-inner overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  )
}