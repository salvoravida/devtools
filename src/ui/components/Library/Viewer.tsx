import React, { useState } from "react";
import { Recording } from "ui/types";
import { RecordingId } from "@recordreplay/protocol";
import BatchActionDropdown from "./BatchActionDropdown";
import { isReplayBrowser } from "ui/utils/environment";
import { PrimaryButton } from "../shared/Button";
import RecordingTable from "./RecordingTable";
import { Redacted } from "../Redacted";
import RecordingRow from "./RecordingRow";
import ViewerHeader, { ViewerHeaderLeft } from "./ViewerHeader";
import sortBy from "lodash/sortBy";

const subStringInString = (subString: string, string: string | null) => {
  if (!string) {
    return false;
  }

  return string.toLowerCase().includes(subString.toLowerCase());
};

function getErrorText() {
  if (isReplayBrowser()) {
    return "Please open a new tab and press the blue record button to record a Replay";
  }

  return <DownloadLinks />;
}

function DownloadLinks() {
  const [clicked, setClicked] = useState(false);

  if (clicked) {
    return (
      <div className="flex flex-col space-y-6" style={{ maxWidth: "24rem" }}>
        <div>Download started.</div>
        <div>{`Once the download is finished, open the Replay Browser installer to install Replay`}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 text-sm" style={{ maxWidth: "24rem" }}>
      <div>{`There's nothing here yet. To create your first replay, you first need to download the Replay Browser`}</div>
      <div className="grid gap-3 grid-cols-2">
        <a
          href="https://static.replay.io/downloads/replay.dmg"
          className={
            "w-full text-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
          }
          onClick={() => setClicked(true)}
        >
          Download for Mac
        </a>
        <a
          href="https://static.replay.io/downloads/linux-replay.tar.bz2"
          className={
            "w-full text-center px-3 py-1.5 border border-transparent font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primaryAccent text-white bg-primaryAccent hover:bg-primaryAccentHover"
          }
          onClick={() => setClicked(true)}
        >
          Download for Linux
        </a>
      </div>
    </div>
  );
}

export default function Viewer({
  recordings,
  workspaceName,
  searchString,
}: {
  recordings: Recording[];
  workspaceName: string;
  searchString: string;
}) {
  const filteredRecordings = recordings.filter(
    r => subStringInString(searchString, r.url) || subStringInString(searchString, r.title)
  );

  return (
    <div className="flex flex-col flex-grow px-8 py-6 bg-gray-100 space-y-5 overflow-hidden">
      <ViewerContent {...{ workspaceName, searchString }} recordings={filteredRecordings} />
    </div>
  );
}

function ViewerContent({
  recordings,
  workspaceName,
}: {
  recordings: Recording[];
  workspaceName: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const addSelectedId = (recordingId: RecordingId) => setSelectedIds([...selectedIds, recordingId]);
  const removeSelectedId = (recordingId: RecordingId) =>
    setSelectedIds(selectedIds.filter(id => id !== recordingId));
  const handleDoneEditing = () => {
    setSelectedIds([]);
    setIsEditing(false);
  };

  const HeaderLeft = (
    <ViewerHeaderLeft>
      <>
        <Redacted>{workspaceName}</Redacted>
        <span>({recordings.length})</span>
      </>
    </ViewerHeaderLeft>
  );

  if (!recordings.length) {
    const errorText = getErrorText();

    // if (searchString) {
    //   errorText = "No replays found, please expand your search";
    // } else {
    //   errorText = getErrorText();
    // }

    return (
      <>
        <ViewerHeader>{HeaderLeft}</ViewerHeader>
        <section className="grid items-center justify-center flex-grow text-sm bg-gray-100">
          <span className="text-gray-500">{errorText}</span>
        </section>
      </>
    );
  }

  let sortedRecordings = sortBy(recordings, recording => {
    const ascOrder = false;
    const order = ascOrder ? 1 : -1;
    return order * new Date(recording.date).getTime();
  });

  return (
    <>
      <ViewerHeader>
        {HeaderLeft}
        <div className="flex flex-row space-x-3">
          {isEditing ? (
            <>
              <BatchActionDropdown setSelectedIds={setSelectedIds} selectedIds={selectedIds} />
              <PrimaryButton color="blue" onClick={handleDoneEditing}>
                Done
              </PrimaryButton>
            </>
          ) : (
            <PrimaryButton color="blue" onClick={() => setIsEditing(true)}>
              Edit
            </PrimaryButton>
          )}
        </div>
      </ViewerHeader>
      <RecordingTable>
        {sortedRecordings.map((r, i) => (
          <RecordingRow
            key={i}
            recording={r}
            selected={selectedIds.includes(r.id)}
            {...{ addSelectedId, removeSelectedId, isEditing }}
          />
        ))}
      </RecordingTable>
    </>
  );
}