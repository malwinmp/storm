import { Activity, ArrowDownUp, Filter } from "lucide-react";
import { DropdownMenu } from "./DropdownMenu.jsx";
import { GlobalTorrentActions } from "./GlobalTorrentActions.jsx";
import { LabelFilter } from "./LabelFilter.jsx";
import { TorrentSearch } from "./TorrentSearch.jsx";
import { states, sorts } from "../utils/formatters.js";

export function TorrentToolbar({
  state,
  setState,
  labelFilters,
  setLabelFilters,
  labelOptions,
  search,
  setSearch,
  sort,
  setSort,
  reverse,
  setReverse,
  filtered,
  toggleView,
  openDialog,
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon">
          <Activity size={19} />
        </div>
        <span>storm</span>
        <i>DELUGE WEB UI</i>
      </div>
      <div className="header-actions">
        <GlobalTorrentActions
          state={state}
          filtered={filtered}
          labelFilters={labelFilters}
          setLabelFilters={setLabelFilters}
          toggleView={toggleView}
          openDialog={openDialog}
        />
        <span className="toolbar-separator" />
        <TorrentSearch search={search} setSearch={setSearch} />
        <span className="toolbar-separator" />
        <DropdownMenu
          label="Sort torrents"
          icon={ArrowDownUp}
          options={Object.entries(sorts).map(([value, label]) => ({
            value,
            label,
          }))}
          value={sort}
          onChange={setSort}
          className="sort-wrap"
          after={
            <button
              type="button"
              className="sort-direction"
              title="Reverse sorting"
              aria-label="Reverse sorting"
              onClick={() => setReverse(!reverse)}
            >
              {reverse ? "↑" : "↓"}
            </button>
          }
        />
        <DropdownMenu
          label="Filter by state"
          icon={Filter}
          options={states.map((value) => ({ value, label: value }))}
          value={state}
          onChange={setState}
          className="filter-wrap"
          count={filtered.length}
        />
        <LabelFilter
          labelOptions={labelOptions}
          labelFilters={labelFilters}
          setLabelFilters={setLabelFilters}
        />
      </div>
    </header>
  );
}
