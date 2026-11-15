import React, { useState, useMemo } from 'react';
import { BlockType } from '../game/types';
import { BLOCK_DEFS } from '../game/textures';
import { CRAFTING_RECIPES, CraftingRecipe, matchRecipe } from '../game/crafting';
import { soundFX } from '../game/audio';
import { X, ArrowRight, RotateCcw, BookOpen, Check } from 'lucide-react';

interface CraftingTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotbar: BlockType[];
  selectedSlot: number;
  onSetHotbarBlock: (slot: number, block: BlockType) => void;
}

export const CraftingTableModal: React.FC<CraftingTableModalProps> = ({
  isOpen,
  onClose,
  hotbar,
  selectedSlot,
  onSetHotbarBlock,
}) => {
  // 3x3 Crafting Grid state (9 slots, null = empty)
  const [grid, setGrid] = useState<(BlockType | null)[]>(Array(9).fill(null));
  
  // Currently held material to place into grid
  const [heldMaterial, setHeldMaterial] = useState<BlockType>(hotbar[selectedSlot] || BlockType.WOOD_OAK);

  // Active view: 'workbench' or 'recipes'
  const [activeTab, setActiveTab] = useState<'workbench' | 'recipes'>('workbench');
  const [recipeCategory, setRecipeCategory] = useState<'all' | 'building' | 'decorations' | 'blocks' | 'special'>('all');
  const [craftNotice, setCraftNotice] = useState<string | null>(null);

  // Dynamic matching against recipes
  const matchedRecipe = useMemo(() => {
    return matchRecipe(grid);
  }, [grid]);

  if (!isOpen) return null;

  // Place held material into slot
  const handleSlotClick = (index: number) => {
    soundFX.playPop();
    setGrid((prev) => {
      const next = [...prev];
      if (next[index] === heldMaterial) {
        next[index] = null;
      } else {
        next[index] = heldMaterial;
      }
      return next;
    });
  };

  // Right-click clears specific slot
  const handleSlotContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    soundFX.playPop();
    setGrid((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  // Clear entire 3x3 grid
  const handleClearGrid = () => {
    soundFX.playPop();
    setGrid(Array(9).fill(null));
  };

  // Craft action
  const handleCraft = () => {
    if (!matchedRecipe) return;

    const { block, count } = matchedRecipe.output;
    soundFX.playPlace('wood');

    onSetHotbarBlock(selectedSlot, block);

    setGrid(Array(9).fill(null));

    setCraftNotice(`Crafted ${count}x ${matchedRecipe.name}! Added to Hotbar Slot ${selectedSlot + 1}`);
    setTimeout(() => setCraftNotice(null), 3000);
  };

  // Auto-fill grid from recipe book
  const handleAutoFillRecipe = (recipe: CraftingRecipe) => {
    soundFX.playPop();
    const newGrid: (BlockType | null)[] = Array(9).fill(null);

    if (recipe.pattern) {
      const pat = recipe.pattern;
      for (let r = 0; r < pat.length; r++) {
        for (let c = 0; c < pat[r].length; c++) {
          newGrid[r * 3 + c] = pat[r][c];
        }
      }
    } else if (recipe.shapeless) {
      recipe.shapeless.forEach((item, idx) => {
        if (idx < 9) newGrid[idx] = item;
      });
    }

    setGrid(newGrid);
    setActiveTab('workbench');
  };

  // Common basic crafting materials for quick selection
  const rawMaterials = [
    BlockType.WOOD_OAK,
    BlockType.WOOD_CHERRY,
    BlockType.PLANKS_OAK,
    BlockType.COBBLESTONE,
    BlockType.STONE,
    BlockType.SAND,
    BlockType.COAL_ORE,
    BlockType.IRON_ORE,
    BlockType.GOLD_ORE,
    BlockType.DIAMOND_ORE,
    BlockType.TORCH,
    BlockType.GLASS,
    BlockType.GRASS,
    BlockType.DIRT,
    BlockType.LEAVES_OAK,
    BlockType.WOOL_WHITE,
    BlockType.BRICK,
    BlockType.PUMPKIN,
    BlockType.BOOKSHELF,
    BlockType.GLOWSTONE,
    BlockType.OBSIDIAN,
    BlockType.REDSTONE_DUST,
    BlockType.REDSTONE_TORCH,
    BlockType.SUGAR_CANE,
    BlockType.DANDELION,
    BlockType.POPPY,
    BlockType.WHEAT_CROP,
    BlockType.NETHER_STAR,
  ];

  const filteredRecipes = CRAFTING_RECIPES.filter(
    (r) => recipeCategory === 'all' || r.category === recipeCategory
  );

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4 font-mono select-none transition-opacity duration-200">
      {/* Minecraft GUI Box with Scale-In animation */}
      <div className="relative flex w-full max-w-xl flex-col rounded-md border-4 border-[#373737] bg-[#c6c6c6] p-4 shadow-[0_0_40px_rgba(0,0,0,0.85)] transition-all duration-200 transform scale-100 opacity-100 animate-in fade-in zoom-in-95 ease-out">
        
        {/* Minecraft GUI Header */}
        <div className="flex items-center justify-between border-b-2 border-[#373737] pb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-lg sm:text-xl font-bold text-[#404040]"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              Crafting
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'workbench' ? 'recipes' : 'workbench')}
              className={`flex items-center gap-1.5 rounded border-2 px-2 py-0.5 text-xs transition-colors ${
                activeTab === 'recipes'
                  ? 'border-[#2d522d] bg-[#438a43] text-white font-bold'
                  : 'border-[#373737] bg-[#8b8b8b] text-[#ffffff] hover:bg-[#999999]'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{activeTab === 'recipes' ? 'Table' : 'Recipe Book'}</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded border-2 border-[#373737] bg-[#8b8b8b] text-white hover:bg-[#a0a0a0] active:translate-y-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Notice alert */}
        {craftNotice && (
          <div className="mt-2 flex items-center gap-2 rounded border-2 border-[#2b5e2b] bg-[#438a43] px-3 py-1 text-xs text-white">
            <Check className="h-3.5 w-3.5" />
            <span>{craftNotice}</span>
          </div>
        )}

        {activeTab === 'workbench' ? (
          <div className="mt-3 flex flex-col gap-3">
            {/* Minecraft 3x3 Table Layout */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 rounded border-2 border-[#373737] bg-[#b5b5b5] p-4 shadow-inner">
              
              {/* 3x3 Crafting Inset Grid */}
              <div className="flex flex-col items-center">
                <div className="mb-1 flex w-full items-center justify-between text-[11px] text-[#404040] font-bold">
                  <span>3×3 Grid</span>
                  <button
                    onClick={handleClearGrid}
                    className="flex items-center gap-0.5 text-[10px] text-[#8a2b2b] hover:underline"
                    title="Clear grid"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                    <span>Clear</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1 rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] p-1.5 shadow-inner">
                  {grid.map((blockType, idx) => {
                    const def = blockType ? BLOCK_DEFS[blockType] : null;

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSlotClick(idx)}
                        onContextMenu={(e) => handleSlotContextMenu(e, idx)}
                        className="group relative flex h-11 w-11 items-center justify-center rounded-[2px] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] hover:bg-[#9e9e9e] active:scale-95 transition-transform"
                        title={def ? `${def.name} (Click to remove)` : 'Empty slot (Click to place active material)'}
                      >
                        {def && (
                          <div
                            className="h-7 w-7 rounded-[1px] shadow-sm"
                            style={{ backgroundColor: def.iconColor, border: '1px solid rgba(0,0,0,0.4)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minecraft Crafting Arrow */}
              <div className="flex items-center justify-center">
                <div className={`p-1 rounded ${matchedRecipe ? 'text-[#306230]' : 'text-[#555555]'}`}>
                  <ArrowRight className="h-8 w-8 stroke-[3]" />
                </div>
              </div>

              {/* Crafting Result Output Slot */}
              <div className="flex flex-col items-center">
                <span className="mb-1 text-[11px] text-[#404040] font-bold">Result</span>
                <button
                  onClick={handleCraft}
                  disabled={!matchedRecipe}
                  className={`group relative flex h-16 w-16 flex-col items-center justify-center rounded-[2px] border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] transition-all ${
                    matchedRecipe
                      ? 'cursor-pointer hover:bg-[#9e9e9e] ring-2 ring-amber-400 active:scale-95'
                      : 'cursor-default opacity-60'
                  }`}
                  title={matchedRecipe ? `Click to craft ${matchedRecipe.name}` : 'Place valid recipe in grid'}
                >
                  {matchedRecipe ? (
                    <>
                      <div
                        className="h-9 w-9 rounded-[1px] shadow-md"
                        style={{
                          backgroundColor: BLOCK_DEFS[matchedRecipe.output.block]?.iconColor,
                          border: '1px solid rgba(0,0,0,0.5)',
                        }}
                      />
                      <span className="absolute bottom-1 right-1 text-xs font-bold text-white drop-shadow-[1px_1px_0px_#000]">
                        {matchedRecipe.output.count}
                      </span>
                    </>
                  ) : null}
                </button>
                {matchedRecipe && (
                  <span className="mt-1 text-[10px] font-bold text-[#2d522d] text-center max-w-[80px] line-clamp-1">
                    {matchedRecipe.name}
                  </span>
                )}
              </div>
            </div>

            {/* Material Selector Row */}
            <div className="flex flex-col gap-1 rounded border-2 border-[#373737] bg-[#b5b5b5] p-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#404040]">
                <span>Placing Material:</span>
                <span className="text-[#1a381a]">
                  {BLOCK_DEFS[heldMaterial]?.name || 'Oak Log'}
                </span>
              </div>

              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] p-1.5">
                {rawMaterials.map((blockType) => {
                  const def = BLOCK_DEFS[blockType];
                  const isSelected = heldMaterial === blockType;

                  return (
                    <button
                      key={blockType}
                      onClick={() => {
                        setHeldMaterial(blockType);
                        soundFX.playPop();
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-[2px] border transition-all ${
                        isSelected
                          ? 'border-white bg-[#ffffff]/40 scale-110 shadow'
                          : 'border-[#444] bg-[#8b8b8b] hover:bg-[#999]'
                      }`}
                      title={def?.name}
                    >
                      <div
                        className="h-5 w-5 rounded-[1px]"
                        style={{ backgroundColor: def?.iconColor, border: '1px solid rgba(0,0,0,0.3)' }}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hotbar Sync Indicator */}
            <div className="flex items-center justify-between text-[11px] text-[#404040] font-bold px-1">
              <span>Target: Hotbar Slot {selectedSlot + 1} ({BLOCK_DEFS[hotbar[selectedSlot]]?.name})</span>
            </div>
          </div>
        ) : (
          /* Recipe Book View */
          <div className="mt-3 flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-1 text-xs">
              {(['all', 'building', 'decorations', 'blocks', 'special'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRecipeCategory(cat)}
                  className={`rounded border-2 px-2.5 py-0.5 capitalize text-xs font-bold transition-colors ${
                    recipeCategory === cat
                      ? 'border-[#2d522d] bg-[#438a43] text-white'
                      : 'border-[#373737] bg-[#8b8b8b] text-[#ffffff] hover:bg-[#999999]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid max-h-72 grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] p-2">
              {filteredRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="flex flex-col justify-between rounded border-2 border-[#373737] bg-[#b5b5b5] p-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="h-7 w-7 rounded-[1px] shadow-sm flex-shrink-0"
                      style={{
                        backgroundColor: BLOCK_DEFS[recipe.output.block]?.iconColor,
                        border: '1px solid rgba(0,0,0,0.4)',
                      }}
                    />
                    <div>
                      <div className="text-xs font-bold text-[#222]">
                        {recipe.name} <span className="text-[#2b5e2b]">x{recipe.output.count}</span>
                      </div>
                      <div className="text-[10px] text-[#555] line-clamp-1">
                        {recipe.description}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between border-t border-[#888] pt-1.5 text-[10px]">
                    <span className="text-[#444] font-semibold">
                      {recipe.pattern ? 'Shaped' : 'Shapeless'}
                    </span>
                    <button
                      onClick={() => handleAutoFillRecipe(recipe)}
                      className="rounded border border-[#2d522d] bg-[#438a43] px-2 py-0.5 font-bold text-white hover:bg-[#52a852]"
                    >
                      Fill into Grid
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-3 flex items-center justify-between border-t-2 border-[#373737] pt-2 text-[11px] text-[#404040]">
          <span>Click slots to place / remove items</span>
          <button
            onClick={onClose}
            className="rounded border-2 border-[#373737] bg-[#8b8b8b] px-4 py-1 text-xs font-bold text-white hover:bg-[#999999] active:translate-y-0.5"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
