const slugifyHeading = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')

const renderInlineMarkdown = (text) => {
  const segments = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return segments.map((segment, index) => {
    const match = segment.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (!match) return <span key={`${segment}-${index}`}>{segment}</span>

    const [, label, url] = match
    if (url.startsWith('#')) {
      const targetId = url.slice(1)
      return (
        <a
          key={`${label}-${index}`}
          href={url}
          onClick={(event) => {
            event.preventDefault()
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
        >
          {label}
        </a>
      )
    }

    if (url.startsWith('/')) {
      return (
        <a key={`${label}-${index}`} href={url}>
          {label}
        </a>
      )
    }

    return (
      <a key={`${label}-${index}`} href={url} target="_blank" rel="noreferrer">
        {label}
      </a>
    )
  })
}

const renderMarkdown = (markdown) => {
  if (!markdown) return null

  const lines = markdown.split('\n')
  const nodes = []
  let paragraph = []
  let listItems = []
  let tableLines = []

  const flushParagraph = (lineIndex) => {
    if (!paragraph.length) return
    const text = paragraph.join(' ').trim()
    if (text) nodes.push(<p key={`p-${lineIndex}`}>{renderInlineMarkdown(text)}</p>)
    paragraph = []
  }

  const flushList = (lineIndex) => {
    if (!listItems.length) return
    nodes.push(
      <ul key={`ul-${lineIndex}`}>
        {listItems.map((item, idx) => (
          <li key={`li-${lineIndex}-${idx}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    )
    listItems = []
  }

  const isTableLine = (line) => line.includes('|')

  const parseTableRow = (line) => {
    const cells = line.split('|').map((cell) => cell.trim())
    if (cells[0] === '') cells.shift()
    if (cells[cells.length - 1] === '') cells.pop()
    return cells
  }

  const isTableSeparator = (line) => {
    const cells = parseTableRow(line)
    if (!cells.length) return false
    return cells.every((cell) => /^:?-{2,}:?$/.test(cell))
  }

  const flushTable = (lineIndex) => {
    if (tableLines.length < 2 || !isTableSeparator(tableLines[1])) {
      tableLines.forEach((line) => paragraph.push(line))
      tableLines = []
      return
    }

    const headers = parseTableRow(tableLines[0])
    const bodyRows = tableLines
      .slice(2)
      .map(parseTableRow)
      .filter((row) => row.length)

    nodes.push(
      <div key={`table-wrap-${lineIndex}`} className="overflow-x-auto">
        <table className="md-table w-full border-collapse">
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={`th-${lineIndex}-${idx}`}>{renderInlineMarkdown(header)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bodyRows.map((row, rowIdx) => (
              <tr key={`tr-${lineIndex}-${rowIdx}`}>
                {row.map((cell, cellIdx) => (
                  <td key={`td-${lineIndex}-${rowIdx}-${cellIdx}`}>{renderInlineMarkdown(cell)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>,
    )

    tableLines = []
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()

    if (!line) {
      flushTable(index)
      flushParagraph(index)
      flushList(index)
      return
    }

    if (isTableLine(line)) {
      flushParagraph(index)
      flushList(index)
      tableLines.push(line)
      return
    }

    flushTable(index)

    if (line.startsWith('## ')) {
      flushParagraph(index)
      flushList(index)
      const headingText = line.slice(3).trim()
      nodes.push(
        <h2 key={`h2-${index}`} id={slugifyHeading(headingText)} className="scroll-mt-24">
          {headingText}
        </h2>,
      )
      return
    }

    if (line.startsWith('# ')) {
      flushParagraph(index)
      flushList(index)
      const headingText = line.slice(2).trim()
      nodes.push(
        <h1 key={`h1-${index}`} id={slugifyHeading(headingText)} className="scroll-mt-24">
          {headingText}
        </h1>,
      )
      return
    }

    if (line.startsWith('- ')) {
      flushParagraph(index)
      listItems.push(line.slice(2))
      return
    }

    flushList(index)
    paragraph.push(line)
  })

  flushTable(lines.length)
  flushParagraph(lines.length)
  flushList(lines.length)
  return nodes
}

const MarkdownProseRenderer = ({ markdown }) => {
  return <article className="md-prose">{renderMarkdown(markdown)}</article>
}

export default MarkdownProseRenderer
