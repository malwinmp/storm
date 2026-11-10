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
  viewFilters,
  activeViewFilterName,
  applyViewFilter,
  deleteViewFilter,
  createViewFilter,
  hasActiveViewFilterChanges,
  updateActiveViewFilter,
}) {
  return (
    <header className="topbar">
      <div className="toolbar-layout">
        <div className="toolbar-row toolbar-row-top">
          <div className="brand">
            <div className="brand-icon">
              <Activity size={19} />
            </div>
            <span>storm</span>
            <i>DELUGE WEB UI</i>
          </div>
        </div>
        <div className="toolbar-lower">
          <div className="toolbar-row toolbar-row-actions">
            <GlobalTorrentActions
              state={state}
              filtered={filtered}
              toggleView={toggleView}
              openDialog={openDialog}
              viewFilters={viewFilters}
              activeViewFilterName={activeViewFilterName}
              applyViewFilter={applyViewFilter}
              deleteViewFilter={deleteViewFilter}
              createViewFilter={createViewFilter}
              hasActiveViewFilterChanges={hasActiveViewFilterChanges}
              updateActiveViewFilter={updateActiveViewFilter}
              variant="actions"
            />
            <TorrentSearch search={search} setSearch={setSearch} />
            <div className="toolbar-filter-group">
              <DropdownMenu
                label="Sort torrents"
                icon={ArrowDownUp}
                options={Object.entries(sorts).map(([value, label]) => ({ value, label }))}
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
            </div>
          </div>
          <div className="toolbar-row toolbar-row-search">
            <GlobalTorrentActions
              state={state}
              filtered={filtered}
              toggleView={toggleView}
              openDialog={openDialog}
              viewFilters={viewFilters}
              activeViewFilterName={activeViewFilterName}
              applyViewFilter={applyViewFilter}
              deleteViewFilter={deleteViewFilter}
              createViewFilter={createViewFilter}
              hasActiveViewFilterChanges={hasActiveViewFilterChanges}
              updateActiveViewFilter={updateActiveViewFilter}
              variant="utilities"
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
        </div>
      </div>
    </header>
  );
}
