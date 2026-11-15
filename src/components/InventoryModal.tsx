import React, { useState, useMemo } from 'react';
import { BlockType } from '../game/types';
import { BLOCK_DEFS } from '../game/textures';
import { soundFX } from '../game/audio';
import { Search, X, Package, ArrowUpDown, Database, Trash2, CheckCircle2, Sparkles } from 'lucide-react';

export type SortMode = 'category' | 'name' | 'hardness';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotbar: BlockType[];
  inventory: (BlockType | null)[];
  selectedSlot: number;
  onSetHotbarBlock: (slot: number, block: BlockType) => void;
  onSetInventorySlot: (slot: number, block: BlockType | null) => void;
  onSwapInventoryHotbar: (invSlot: number, hotbarSlot: number) => void;
  onSortInventory: (mode: SortMode) => void;
  onOpenCrafting?: () => void;
  onResetStorage?: () => void;
  savedDeltaCount?: number;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  hotbar,
  inventory,
  selectedSlot,
  onSetHotbarBlock,
  onSetInventorySlot,
  onSwapInventoryHotbar,
  onSortInventory,
  onOpenCrafting,
  onResetStorage,
  savedDeltaCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState<'backpack' | 'creative'>('backpack');
  const [activeCategory, setActiveCategory] = useState<'all' | 'building' | 'nature' | 'ores' | 'special'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('category');
  const [selectedInvSlot, setSelectedInvSlot] = useState<number | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const allBlocks = Object.values(BLOCK_DEFS).filter(
    (b) => b.id !== BlockType.AIR
  );

  const categoryPriority: Record<string, number> = {
    building: 1,
    nature: 2,
    ores: 3,
    special: 4,
  };

  const sortedAndFilteredBlocks = useMemo(() => {
    const filtered = allBlocks.filter((b) => {
      const matchesCategory = activeCategory === 'all' || b.category === activeCategory;
      const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sortMode === 'category') {
        const catA = categoryPriority[a.category] ?? 99;
        const catB = categoryPriority[b.category] ?? 99;
        if (catA !== catB) return catA - catB;
        return a.name.localeCompare(b.name);
      } else if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortMode === 'hardness') {
        return b.hardness - a.hardness || a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [allBlocks, activeCategory, searchQuery, sortMode]);

  // Click handler in Creative Palette view
  const handleSelectCreativeBlock = (blockType: BlockType) => {
    soundFX.playPop();
    if (selectedInvSlot !== null) {
      onSetInventorySlot(selectedInvSlot, blockType);
      setStatusNotice(`Assigned ${BLOCK_DEFS[blockType]?.name} to Inventory Slot ${selectedInvSlot + 1}`);
      setSelectedInvSlot(null);
    } else {
      onSetHotbarBlock(selectedSlot, blockType);
      setStatusNotice(`Assigned ${BLOCK_DEFS[blockType]?.name} to Hotbar Slot ${selectedSlot + 1}`);
    }
    setTimeout(() => setStatusNotice(null), 2500);
  };

  // Click on Inventory Slot
  const handleInventorySlotClick = (idx: number) => {
    soundFX.playPop();
    if (selectedInvSlot === idx) {
      setSelectedInvSlot(null);
    } else if (selectedInvSlot !== null) {
      // Swap two inventory slots
      const itemA = inventory[selectedInvSlot];
      const itemB = inventory[idx];
      onSetInventorySlot(selectedInvSlot, itemB);
      onSetInventorySlot(idx, itemA);
      setSelectedInvSlot(null);
    } else {
      setSelectedInvSlot(idx);
    }
  };

  // Click on Hotbar Slot in Backpack view
  const handleHotbarSlotClick = (hotbarIdx: number) => {
    soundFX.playPop();
    if (selectedInvSlot !== null) {
      // Swap selected inventory item with this hotbar slot
      onSwapInventoryHotbar(selectedInvSlot, hotbarIdx);
      setStatusNotice(`Swapped with Hotbar Slot ${hotbarIdx + 1}`);
      setSelectedInvSlot(null);
      setTimeout(() => setStatusNotice(null), 2500);
    } else {
      onSetHotbarBlock(hotbarIdx, hotbar[hotbarIdx]);
    }
  };

  // Toggle sorting on 27-slot inventory
  const handleTriggerSort = () => {
    soundFX.playPop();
    const nextMode: SortMode =
      sortMode === 'category' ? 'name' : sortMode === 'name' ? 'hardness' : 'category';
    setSortMode(nextMode);
    onSortInventory(nextMode);
    setStatusNotice(`Inventory sorted by ${nextMode}! (Saved)`);
    setTimeout(() => setStatusNotice(null), 2500);
  };

  const getSortLabel = () => {
    switch (sortMode) {
      case 'category':
        return 'Category (Blocks → Nature → Ores)';
      case 'name':
        return 'Alphabetical (A - Z)';
      case 'hardness':
        return 'Tier / Hardness';
    }
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4 font-mono select-none transition-opacity duration-200">
      {/* Minecraft-styled Modal Container with Smooth Scale-In Animation */}
      <div className="relative flex w-full max-w-xl flex-col rounded-md border-4 border-[#373737] bg-[#c6c6c6] p-4 shadow-[0_0_40px_rgba(0,0,0,0.9)] transition-all duration-200 transform scale-100 opacity-100 animate-in fade-in zoom-in-95 ease-out">
        
        {/* Header with Navigation Tabs */}
        <div className="flex items-center justify-between border-b-2 border-[#373737] pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('backpack');
                soundFX.playPop();
              }}
              className={`flex items-center gap-1.5 rounded-t border-2 px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'backpack'
                  ? 'border-[#373737] bg-[#e0e0e0] text-[#1e1e1e] border-b-transparent shadow'
                  : 'border-transparent text-[#555] hover:text-black'
              }`}
            >
              <Package className="h-4 w-4 text-[#306230]" />
              <span>Backpack & Hotbar</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('creative');
                soundFX.playPop();
              }}
              className={`flex items-center gap-1.5 rounded-t border-2 px-3 py-1 text-xs font-bold transition-colors ${
                activeTab === 'creative'
                  ? 'border-[#373737] bg-[#e0e0e0] text-[#1e1e1e] border-b-transparent shadow'
                  : 'border-transparent text-[#555] hover:text-black'
              }`}
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>Creative Palette</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded border-2 border-[#373737] bg-[#8b8b8b] text-white hover:bg-[#a0a0a0] active:translate-y-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Tab 1: Backpack & Hotbar (27 slots + 9 hotbar slots) */}
        {activeTab === 'backpack' ? (
          <div className="mt-2.5 flex flex-col gap-2.5">
            {/* Top Toolbar: Sort Button + Status Notice */}
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-[#333]">
                27-Slot Player Inventory <span className="text-[#666] font-normal">(Click an item to move or swap)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleTriggerSort}
                  className="flex items-center gap-1 rounded border-2 border-t-white border-l-white border-b-[#373737] border-r-[#373737] bg-[#8b8b8b] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#999999] active:translate-y-0.5 transition-transform"
                  title="Sort 27 inventory slots by category, name, or hardness"
                >
                  <ArrowUpDown className="h-3.5 w-3.5 text-amber-300" />
                  <span>Sort ({sortMode})</span>
                </button>
              </div>
            </div>

            {/* Status notice */}
            {statusNotice && (
              <div className="rounded bg-emerald-800/80 px-2.5 py-1 text-center text-xs font-bold text-emerald-100 shadow animate-pulse">
                {statusNotice}
              </div>
            )}

            {/* 27 Inventory Slots (3 Rows of 9) */}
            <div className="grid grid-cols-9 gap-1 rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] p-2 shadow-inner">
              {inventory.map((blockType, idx) => {
                const def = blockType ? BLOCK_DEFS[blockType] : null;
                const isSelected = selectedInvSlot === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleInventorySlotClick(idx)}
                    className={`relative flex h-10 w-full items-center justify-center rounded-[1px] transition-all ${
                      isSelected
                        ? 'border-2 border-white bg-white/40 scale-105 shadow-md z-10'
                        : 'border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] hover:bg-[#999999]'
                    }`}
                    title={def ? `${def.name} (${def.category})` : `Empty Slot ${idx + 1}`}
                  >
                    {def ? (
                      <div
                        className="h-6 w-6 rounded-[1px] shadow-sm transition-transform hover:scale-110"
                        style={{
                          backgroundColor: def.iconColor,
                          border: '1px solid rgba(0,0,0,0.3)',
                        }}
                      />
                    ) : (
                      <span className="text-[9px] text-[#666]">{idx + 1}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Hotbar Divider / Label */}
            <div className="flex items-center justify-between text-[11px] font-bold text-[#333] pt-1">
              <span>9 Hotbar Slots {selectedInvSlot !== null && <span className="text-emerald-700">(Click slot to swap)</span>}</span>
              <span className="text-[10px] text-[#666]">Keys 1 - 9</span>
            </div>

            {/* 9 Hotbar Slots Grid */}
            <div className="grid grid-cols-9 gap-1 rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#7c7c7c] p-2 shadow-inner">
              {hotbar.map((blockType, idx) => {
                const def = BLOCK_DEFS[blockType];
                const isActive = selectedSlot === idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleHotbarSlotClick(idx)}
                    className={`relative flex h-11 w-full items-center justify-center rounded-[1px] transition-all ${
                      isActive
                        ? 'border-2 border-amber-400 bg-amber-400/20 scale-105 shadow-md z-10'
                        : 'border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] hover:bg-[#9e9e9e]'
                    }`}
                    title={`Hotbar Slot ${idx + 1}: ${def?.name}`}
                  >
                    <span className="absolute top-0.5 left-0.5 text-[8px] font-bold text-white/70">
                      {idx + 1}
                    </span>
                    <div
                      className="h-6 w-6 rounded-[1px] shadow-sm"
                      style={{
                        backgroundColor: def?.iconColor || '#888',
                        border: '1px solid rgba(0,0,0,0.3)',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Tab 2: Creative Palette (Search, Category Filters, Block Catalog) */
          <div className="mt-2.5 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute top-2 left-2.5 h-3.5 w-3.5 text-[#555]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search blocks (stone, diamond, wood...)"
                  className="w-full rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-white py-1 pr-3 pl-8 text-xs text-black placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleTriggerSort}
                className="flex items-center gap-1.5 rounded border-2 border-t-white border-l-white border-b-[#373737] border-r-[#373737] bg-[#8b8b8b] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#999999] active:translate-y-0.5 transition-transform"
                title="Change sort order"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-amber-300" />
                <span>Sort: <span className="text-amber-300 capitalize">{sortMode}</span></span>
              </button>
            </div>

            {/* Active Sort Hint */}
            <div className="text-[10px] text-[#555] font-semibold flex items-center justify-between px-1">
              <span>Organized by: <span className="text-[#2b5e2b] font-bold">{getSortLabel()}</span></span>
              <span className="text-[10px] text-[#444]">{sortedAndFilteredBlocks.length} items</span>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-1 text-xs">
              {(['all', 'building', 'nature', 'ores', 'special'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    soundFX.playPop();
                  }}
                  className={`rounded border-2 px-2.5 py-0.5 capitalize text-xs font-bold transition-colors ${
                    activeCategory === cat
                      ? 'border-[#2d522d] bg-[#438a43] text-white'
                      : 'border-[#373737] bg-[#8b8b8b] text-[#ffffff] hover:bg-[#999999]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Target Destination Hint */}
            <div className="text-[11px] font-bold text-[#404040]">
              Click any block to place into{' '}
              {selectedInvSlot !== null
                ? `Inventory Slot ${selectedInvSlot + 1}`
                : `Hotbar Slot ${selectedSlot + 1}`}
            </div>

            {/* Recessed Blocks Grid */}
            <div className="grid max-h-56 grid-cols-4 sm:grid-cols-6 gap-1.5 overflow-y-auto rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] p-2 shadow-inner">
              {sortedAndFilteredBlocks.map((block) => (
                <button
                  key={block.id}
                  onClick={() => handleSelectCreativeBlock(block.id)}
                  className="group relative flex flex-col items-center justify-center rounded-[2px] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] p-1.5 hover:bg-[#9e9e9e] active:scale-95 transition-transform"
                  title={`${block.name} (${block.category}) - Click to assign`}
                >
                  <div
                    className="h-8 w-8 rounded-[1px] shadow-sm transition-transform group-hover:scale-110"
                    style={{
                      backgroundColor: block.iconColor,
                      border: '1px solid rgba(0,0,0,0.3)',
                    }}
                  />
                  <span className="mt-1 text-[10px] font-semibold text-[#1e1e1e] text-center line-clamp-1">
                    {block.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LocalStorage Persistence Status Footer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t-2 border-[#373737] pt-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Persisted in LocalStorage ({savedDeltaCount} world edits)</span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenCrafting && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCrafting();
                }}
                className="flex items-center gap-1 rounded border-2 border-[#2d522d] bg-[#438a43] px-2.5 py-0.5 text-xs font-bold text-white hover:bg-[#52a852] transition-colors"
              >
                <span>Crafting Table</span>
              </button>
            )}

            {onResetStorage && (
              <>
                {showConfirmReset ? (
                  <div className="flex items-center gap-1 bg-red-100 px-2 py-0.5 rounded border border-red-300">
                    <span className="text-[10px] text-red-700 font-bold">Wipe world edits?</span>
                    <button
                      onClick={() => {
                        onResetStorage();
                        setShowConfirmReset(false);
                      }}
                      className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-red-700"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setShowConfirmReset(false)}
                      className="rounded bg-neutral-400 px-1.5 py-0.5 text-[10px] font-bold text-white"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowConfirmReset(true)}
                    className="flex items-center gap-1 rounded border border-neutral-500 bg-neutral-200 px-2 py-0.5 text-[11px] text-neutral-700 hover:bg-neutral-300"
                    title="Clear saved world modifications & reset inventory to defaults"
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                    <span>Reset Saved Data</span>
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="rounded border-2 border-[#373737] bg-[#8b8b8b] px-4 py-1 text-xs font-bold text-white hover:bg-[#999999] active:translate-y-0.5"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
