import React, { useState } from "react";
import { connect, ConnectedProps } from "react-redux";
import hooks from "ui/hooks";
import * as actions from "ui/actions/app";
import { selectors } from "ui/reducers";
import { UIState } from "ui/state";
import Modal from "./NewModal";
import useAuth0 from "ui/utils/useAuth0";

function addLoomComment(loom: string) {
  return JSON.stringify({
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text: loom }],
      },
    ],
  });
}

function NewAttachment({ hideModal, modalOptions }: PropsFromRedux) {
  const addCommentReply = hooks.useAddCommentReply();
  const [url, setUrl] = useState("");
  const loom = url.match(/loom\.com\/share\/(\S*?)(\"|\?|$)/)?.[1];
  const { isAuthenticated } = useAuth0();

  const onChange = (e: any) => {
    setUrl(e.target.value);
  };

  const onSubmit = () => {
    if (loom && modalOptions?.comment) {
      const reply = { ...modalOptions.comment, content: addLoomComment(url) };
      addCommentReply({
        commentId: reply.parentId,
        content: reply.content,
        isPublished: true,
      });
      hideModal();
    }
  };

  const color = !loom ? "bg-gray-300" : "bg-primaryAccent";

  // Un-authenticated users can't comment on Replays.
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Modal options={{ maskTransparency: "translucent" }} onMaskClick={hideModal}>
      <div className="overflow-hidden bg-white rounded-lg" style={{ width: "600px" }}>
        <div className="flex items-center h-12 width-full bg-primaryAccent">
          <div className="ml-3 mr-2 img loom" style={{ background: "white" }}></div>
          <div className="text-lg text-white">Add Loom url</div>
        </div>
        <div className="flex items-center h-12 pr-3">
          <form className="flex w-full" onSubmit={onSubmit}>
            <input
              type="text"
              placeholder="http://loom.com/share"
              onChange={onChange}
              value={url}
              className="flex-grow mr-3 text-gray-500 placeholder-gray-300 border-none align-center h-9 focus:ring-0"
            ></input>
            <button className={`${color} rounded-lg py-1 px-2 text-white`} onClick={onSubmit}>
              Save
            </button>
          </form>
        </div>
      </div>
    </Modal>
  );
}

const connector = connect(
  (state: UIState) => ({
    modalOptions: selectors.getModalOptions(state),
  }),
  {
    setModal: actions.setModal,
    hideModal: actions.hideModal,
  }
);
type PropsFromRedux = ConnectedProps<typeof connector>;
export default connector(NewAttachment);
