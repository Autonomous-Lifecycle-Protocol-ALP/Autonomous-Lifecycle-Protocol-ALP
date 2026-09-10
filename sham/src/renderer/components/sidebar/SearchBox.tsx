import React from 'react';

export function SearchBox(): React.JSX.Element {
  return (
    <div className="sidebar-search">
      <input
        type="text"
        className="sidebar-search-input"
        placeholder="Search files..."
      />
    </div>
  );
}
