import * as React from 'react'
import { forwardRef, RefObject, useContext, useMemo } from 'react'
import { DataSheetGridContext } from './DataSheetGridContext'
import s from './styles.css'
import cx from 'classnames'

const buildSquare = (top, right, bottom, left) => {
  return [
    [left, top],
    [right, top],
    [right, bottom],
    [left, bottom],
    [left, top],
  ]
}

const buildClipPath = (top, right, bottom, left) => {
  const values = [
    ...buildSquare(0, '100%', '100%', 0),
    ...buildSquare(top, right, bottom, left),
  ]

  return `polygon(evenodd, ${values
    .map((pair) =>
      pair
        .map((value) =>
          typeof value === 'number' && value !== 0 ? value + 'px' : value
        )
        .join(' ')
    )
    .join(',')})`
}

export const InnerContainer = forwardRef(
  ({ children, ...rest }, ref: RefObject<HTMLDivElement>) => {
    const {
      activeCell,
      columnWidths,
      rowHeight,
      headerRowHeight,
      selection,
      data,
      editing,
      columns,
      isCellDisabled,
    } = useContext(DataSheetGridContext)

    const extraPixelV = (rowI: number): number => {
      return rowI < data.length - 1 ? 1 : 0
    }

    const extraPixelH = (colI: number): number => {
      return colI < columns.length - 2 ? 1 : 0
    }

    const activeCellRect = activeCell && {
      width: columnWidths[activeCell.col + 1] + extraPixelH(activeCell.col),
      height: rowHeight + extraPixelV(activeCell.row),
      left: columnWidths
        .slice(0, activeCell.col + 1)
        .reduce((a, b) => a + b, 0),
      top: rowHeight * activeCell.row + headerRowHeight,
    }

    const selectionRect = selection && {
      width: columnWidths
        .slice(selection.min.col + 1, selection.max.col + 2)
        .reduce((a, b) => a + b, extraPixelH(selection.max.col)),
      height:
        rowHeight * (selection.max.row - selection.min.row + 1) +
        extraPixelV(selection.max.row),
      left: columnWidths
        .slice(0, selection.min.col + 1)
        .reduce((a, b) => a + b, 0),
      top: rowHeight * selection.min.row + headerRowHeight,
    }

    const selectionIsDisabled = useMemo(() => {
      if (!selection) {
        return false
      }

      for (let col = selection.min.col; col <= selection.max.col; ++col) {
        for (let row = selection.min.row; row <= selection.max.row; ++row) {
          if (!isCellDisabled({ col, row })) {
            return false
          }
        }
      }

      return true
    }, [isCellDisabled, selection])

    return (
      <div ref={ref} {...rest}>
        {children}
        {activeCellRect && (
          <div
            className={cx({
              [s.dsgActiveCell]: true,
              [s.dsgActiveCellFocus]: editing,
              [s.dsgActiveCellDisabled]:
                activeCell && isCellDisabled(activeCell),
            })}
            style={activeCellRect}
          />
        )}
        {selectionRect && activeCellRect && (
          <div
            className={cx({ [s.dsgSelectionRect]: true, [s.dsgSelectionRectDisabled]: selectionIsDisabled })}
            style={{
              ...selectionRect,
              clipPath: buildClipPath(
                activeCellRect.top - selectionRect.top,
                activeCellRect.left - selectionRect.left,
                activeCellRect.top + activeCellRect.height - selectionRect.top,
                activeCellRect.left + activeCellRect.width - selectionRect.left
              ),
            }}
          />
        )}
      </div>
    )
  }
)
