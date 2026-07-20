import React, { useEffect, useState, useCallback } from "react";
import { api } from "./api.js";
import { useBoardSocket } from "./useSocket.js";
import Toolbar from "./components/Toolbar.jsx";
import Board from "./components/Board.jsx";
import IssueDetail from "./components/IssueDetail.jsx";
import PendingPanel from "./components/PendingPanel.jsx";

function getAuthor() {
  return localStorage.getItem("voc-board-author") || "";
}

export default function App() {
  const [board, setBoard] = useState({ issues: [], notes: {}, pending: [], appliedLog: [] });
  const [search, setSearch] = useState("");
  const [author, setAuthor] = useState(getAuthor);
  const [selectedIssueId, setSelectedIssueId] = useState(null);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    api.getBoard().then(setBoard).catch(console.error);
  }, []);

  useEffect(() => {
    localStorage.setItem("voc-board-author", author);
  }, [author]);

  useBoardSocket(
    useCallback((data) => {
      setBoard(data);
      setConnected(true);
    }, [])
  );

  const handleMove = useCallback(
    (issueId, toStage) => {
      api.moveIssue(issueId, toStage, author || "anonymous").then(setBoard).catch(console.error);
    },
    [author]
  );

  const handleOpen = useCallback((issue) => setSelectedIssueId(issue.id), []);

  const handleAddNote = useCallback((issueId, text, who) => {
    api.addNote(issueId, text, who || "anonymous").then(setBoard).catch(console.error);
  }, []);

  const handleDeleteNote = useCallback((issueId, noteId) => {
    api.deleteNote(issueId, noteId).then(setBoard).catch(console.error);
  }, []);

  const handleSync = useCallback(async () => {
    const res = await api.sync();
    setBoard(res.board);
    return res;
  }, []);

  const selectedIssue = board.issues.find((i) => i.id === selectedIssueId) || null;

  return (
    <div className="app">
      <Toolbar
        search={search}
        onSearch={setSearch}
        author={author || "anonymous"}
        onAuthorChange={setAuthor}
        pendingCount={board.pending.length}
        onOpenPending={() => setPendingOpen(true)}
        connected={connected}
      />
      <Board
        issues={board.issues}
        notes={board.notes}
        search={search}
        onMove={handleMove}
        onOpen={handleOpen}
      />
      {selectedIssue && (
        <IssueDetail
          issue={selectedIssue}
          notes={board.notes[selectedIssue.id]}
          author={author || "anonymous"}
          onAddNote={handleAddNote}
          onDeleteNote={handleDeleteNote}
          onClose={() => setSelectedIssueId(null)}
        />
      )}
      {pendingOpen && (
        <PendingPanel
          pending={board.pending}
          appliedLog={board.appliedLog}
          onSync={handleSync}
          onClose={() => setPendingOpen(false)}
        />
      )}
    </div>
  );
}
