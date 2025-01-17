import { updateHoveredLineNumber } from "devtools/client/debugger/src/actions/breakpoints/index";
import minBy from "lodash/minBy";
import React, { useRef, useState, useEffect, ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "ui/setup/hooks";
import { KeyModifiers } from "ui/components/KeyModifiers";
import MaterialIcon from "ui/components/shared/MaterialIcon";
import hooks from "ui/hooks";
import { Nag } from "ui/hooks/users";
import { setHoveredLineNumberLocation } from "ui/reducers/app";
import { trackEvent } from "ui/utils/telemetry";
import { shouldShowNag } from "ui/utils/user";

import { getSelectedSource } from "ui/reducers/sources";

import StaticTooltip from "./StaticTooltip";
import {
  fetchHitCounts,
  getHitCountsForSource,
  getHitCountsStatusForSourceByLine,
} from "ui/reducers/hitCounts";
import { LoadingStatus } from "ui/utils/LoadingStatus";

export const AWESOME_BACKGROUND = `linear-gradient(116.71deg, #FF2F86 21.74%, #EC275D 83.58%), linear-gradient(133.71deg, #01ACFD 3.31%, #F155FF 106.39%, #F477F8 157.93%, #F33685 212.38%), #007AFF`;

function Wrapper({
  children,
  loading,
  showWarning,
}: {
  children: ReactNode;
  loading?: boolean;
  showWarning?: boolean;
}) {
  const { nags } = hooks.useGetUserInfo();
  const showNag = shouldShowNag(nags, Nag.FIRST_BREAKPOINT_ADD);

  if (showWarning) {
    return (
      <div className="space-x-2 bg-red-700 static-tooltip-content">
        <MaterialIcon>warning_amber</MaterialIcon>
        <div>{children}</div>
      </div>
    );
  } else if (showNag) {
    return (
      <div className="space-x-2 static-tooltip-content" style={{ background: AWESOME_BACKGROUND }}>
        <MaterialIcon iconSize="xl">auto_awesome</MaterialIcon>
        <div className="flex flex-col items-start">
          {!loading ? <div className="font-bold">Click to add a print statement</div> : null}
          <div>{children}</div>
        </div>
      </div>
    );
  }

  return <div className="bg-gray-700 static-tooltip-content">{children}</div>;
}

type Props = {
  editor: any;
  keyModifiers: KeyModifiers;
};

export default function LineNumberTooltipWrapper(props: Props) {
  return <LineNumberTooltip {...props} />;
}

function LineNumberTooltip({ editor, keyModifiers }: Props) {
  const dispatch = useAppDispatch();
  const [targetNode, setTargetNode] = useState<HTMLElement | null>(null);
  const lastHoveredLineNumber = useRef<number | null>(null);
  const isMetaActive = keyModifiers.meta;
  const source = useAppSelector(getSelectedSource);

  const hitCounts = useAppSelector(state => getHitCountsForSource(state, source!.id));
  const hitCountStatus = useAppSelector(state =>
    getHitCountsStatusForSourceByLine(state, source!.id, lastHoveredLineNumber.current || 0)
  );

  let hits: number | undefined;

  if (lastHoveredLineNumber.current && hitCounts) {
    const lineHitCounts = minBy(
      hitCounts.filter(hitCount => hitCount.location.line === lastHoveredLineNumber.current),
      b => b.location.column
    );
    hits = lineHitCounts?.hits;
  }

  useEffect(() => {
    const setHoveredLineNumber = ({
      lineNumber,
      lineNumberNode,
    }: {
      lineNumber: number;
      lineNumberNode: HTMLElement;
    }) => {
      if (lineNumber !== lastHoveredLineNumber.current) {
        lastHoveredLineNumber.current = lineNumber;
      }
      dispatch(updateHoveredLineNumber(lineNumber));
      setTargetNode(lineNumberNode);
      var rect = editor.codeMirror.getWrapperElement().getBoundingClientRect();
      var topVisibleLine = editor.codeMirror.lineAtHeight(rect.top, "window");
      var bottomVisibleLine = editor.codeMirror.lineAtHeight(rect.bottom, "window");
      dispatch(fetchHitCounts(source!.id, editor.codeMirror.lineAtHeight()));
      dispatch(fetchHitCounts(source!.id, topVisibleLine - 10));
      dispatch(fetchHitCounts(source!.id, bottomVisibleLine + 10));
    };
    const clearHoveredLineNumber = () => {
      setTargetNode(null);
      dispatch(setHoveredLineNumberLocation(null));
    };

    editor.codeMirror.on("lineMouseEnter", setHoveredLineNumber);
    editor.codeMirror.on("lineMouseLeave", clearHoveredLineNumber);
    return () => {
      editor.codeMirror.off("lineMouseEnter", setHoveredLineNumber);
      editor.codeMirror.off("lineMouseLeave", clearHoveredLineNumber);
    };
  }, [dispatch, editor.codeMirror, source]);

  useEffect(() => {
    if (hits) {
      trackEvent(hits ? "breakpoint.preview_has_hits" : "breakpoint.preview_no_hits");
      trackEvent("breakpoint.preview_hits", { hitsCount: hits || null });
    }
  }, [hits]);

  if (!targetNode || isMetaActive) {
    return null;
  }

  if (hitCountStatus === LoadingStatus.ERRORED) {
    return (
      <StaticTooltip targetNode={targetNode}>
        <Wrapper showWarning={true}>Failed to load hit counts for this section</Wrapper>
      </StaticTooltip>
    );
  }

  if (!hitCounts) {
    return (
      <StaticTooltip targetNode={targetNode}>
        <Wrapper loading>Loading…</Wrapper>
      </StaticTooltip>
    );
  }

  if (hits === undefined) {
    return null;
  }

  const count = hits || 0;

  return (
    <StaticTooltip targetNode={targetNode}>
      <Wrapper showWarning={count > 200}>
        {count} hit{count == 1 ? "" : "s"}
      </Wrapper>
    </StaticTooltip>
  );
}
