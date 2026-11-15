import React, { useState, useEffect } from 'react';
import { BlockType } from '../game/types';
import { BLOCK_DEFS } from '../game/textures';
import { soundFX } from '../game/audio';
import { X, Flame, ArrowRight, Sparkles } from 'lucide-react';

interface FurnaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotbar: BlockType[];
  selectedSlot: number;
  onSetHotbarBlock: (slot: number, block: BlockType) => void;
}

// Smelting recipe table
interface SmeltRecipe {
  input: BlockType;
  output: BlockType;
  name: string;
}

const SMELT_RECIPES: SmeltRecipe[] = [
  { input: BlockType.IRON_ORE, output: BlockType.IRON_ORE, name: 'Refined Iron' },
  { input: BlockType.GOLD_ORE, output: BlockType.GOLD_BLOCK, name: 'Pure Gold Block' },
  { input: BlockType.SAND, output: BlockType.GLASS, name: 'Glass' },
  { input: BlockType.COBBLESTONE, output: BlockType.STONE, name: 'Smooth Stone' },
  { input: BlockType.WOOD_OAK, output: BlockType.TORCH, name: 'Charcoal & Torches' },
  { input: BlockType.WOOD_CHERRY, output: BlockType.TORCH, name: 'Charcoal' },
];

export const FurnaceModal: React.FC<FurnaceModalProps> = ({
  isOpen,
  onClose,
  hotbar,
  selectedSlot,
  onSetHotbarBlock,
}) => {
  const [inputBlock, setInputBlock] = useState<BlockType | null>(BlockType.IRON_ORE);
  const [fuelBlock, setFuelBlock] = useState<BlockType | null>(BlockType.COAL_ORE);
  const [outputBlock, setOutputBlock] = useState<BlockType | null>(null);
  const [isSmelting, setIsSmelting] = useState(false);
  const [cookProgress, setCookProgress] = useState(0); // 0 to 100
  const [flameBurn, setFlameBurn] = useState(100);

  // Auto-smelt loop when valid recipe and fuel are loaded
  useEffect(() => {
    if (!isOpen || !inputBlock || !fuelBlock || isSmelting) return;

    const recipe = SMELT_RECIPES.find((r) => r.input === inputBlock);
    if (!recipe) return;

    setIsSmelting(true);
    let current = 0;
    const interval = setInterval(() => {
      current += 10;
      setCookProgress(current);
      setFlameBurn((prev) => Math.max(10, prev - 8));

      if (current >= 100) {
        clearInterval(interval);
        setIsSmelting(false);
        setOutputBlock(recipe.output);
        setCookProgress(0);
        soundFX.playPlace('stone');
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen, inputBlock, fuelBlock, isSmelting]);

  if (!isOpen) return null;

  const handleTakeOutput = () => {
    if (!outputBlock) return;
    soundFX.playPop();
    onSetHotbarBlock(selectedSlot, outputBlock);
    setOutputBlock(null);
    setInputBlock(null);
  };

  const handleSetInput = (block: BlockType) => {
    soundFX.playPop();
    setInputBlock(block);
    setOutputBlock(null);
    setCookProgress(0);
  };

  const handleSetFuel = (block: BlockType) => {
    soundFX.playPop();
    setFuelBlock(block);
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4 font-mono select-none transition-opacity duration-200">
      {/* Minecraft-styled Furnace GUI with Smooth Scale-In Animation */}
      <div className="relative flex w-full max-w-md flex-col rounded-md border-4 border-[#373737] bg-[#c6c6c6] p-4 shadow-[0_0_40px_rgba(0,0,0,0.9)] transition-all duration-200 transform scale-100 opacity-100 animate-in fade-in zoom-in-95 ease-out">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#373737] pb-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-600 animate-pulse" />
            <span
              className="text-lg font-bold text-[#373737]"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              Furnace Smelting
            </span>
          </div>

          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded border-2 border-[#373737] bg-[#8b8b8b] text-white hover:bg-[#a0a0a0] active:translate-y-0.5"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Smelting Area */}
        <div className="mt-4 flex items-center justify-center gap-6 rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] p-6 shadow-inner">
          {/* Input & Fuel Column */}
          <div className="flex flex-col items-center gap-3">
            {/* Top Ingredient Slot */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-[#222]">Ingredient</span>
              <div
                className="relative flex h-14 w-14 items-center justify-center rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] shadow-inner"
              >
                {inputBlock ? (
                  <div
                    className="h-8 w-8 rounded-[1px] shadow-sm"
                    style={{ backgroundColor: BLOCK_DEFS[inputBlock]?.iconColor || '#888' }}
                  />
                ) : (
                  <span className="text-[10px] text-[#555]">Empty</span>
                )}
              </div>
            </div>

            {/* Burning Fire Indicator */}
            <div className="flex items-center justify-center">
              <Flame
                className={`h-6 w-6 transition-colors ${
                  isSmelting ? 'text-orange-500 animate-bounce' : 'text-[#555]'
                }`}
              />
            </div>

            {/* Bottom Fuel Slot */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="relative flex h-14 w-14 items-center justify-center rounded border-2 border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b] shadow-inner"
              >
                {fuelBlock ? (
                  <div
                    className="h-8 w-8 rounded-[1px] shadow-sm"
                    style={{ backgroundColor: BLOCK_DEFS[fuelBlock]?.iconColor || '#333' }}
                  />
                ) : (
                  <span className="text-[10px] text-[#555]">Empty</span>
                )}
              </div>
              <span className="text-[10px] font-bold text-[#222]">Fuel (Coal)</span>
            </div>
          </div>

          {/* Cooking Arrow & Progress */}
          <div className="flex flex-col items-center gap-1.5 px-2">
            <div className="flex items-center gap-1">
              <ArrowRight className="h-8 w-8 text-[#333]" />
            </div>
            {/* Progress Bar */}
            <div className="h-2 w-16 overflow-hidden rounded-full border border-black bg-[#444]">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-amber-300 transition-all duration-150"
                style={{ width: `${cookProgress}%` }}
              />
            </div>
            <span className="text-[9px] text-[#333] font-bold">
              {isSmelting ? `${cookProgress}% Smelting` : 'Ready'}
            </span>
          </div>

          {/* Output Result Slot */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-bold text-[#222]">Result</span>
            <button
              onClick={handleTakeOutput}
              disabled={!outputBlock}
              className={`relative flex h-16 w-16 items-center justify-center rounded border-2 transition-transform ${
                outputBlock
                  ? 'border-amber-400 bg-amber-400/20 hover:scale-105 active:scale-95 shadow-lg cursor-pointer'
                  : 'border-t-[#373737] border-l-[#373737] border-b-white border-r-white bg-[#8b8b8b]'
              }`}
            >
              {outputBlock ? (
                <div className="flex flex-col items-center">
                  <div
                    className="h-9 w-9 rounded-[1px] shadow-sm"
                    style={{ backgroundColor: BLOCK_DEFS[outputBlock]?.iconColor }}
                  />
                  <span className="text-[8px] font-bold text-emerald-800 mt-0.5">Click to Take</span>
                </div>
              ) : (
                <span className="text-[10px] text-[#555]">Empty</span>
              )}
            </button>
          </div>
        </div>

        {/* Quick Smelt Material Presets */}
        <div className="mt-3 flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-[#444]">Load Smeltable Materials:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { block: BlockType.IRON_ORE, label: 'Iron Ore' },
              { block: BlockType.GOLD_ORE, label: 'Gold Ore' },
              { block: BlockType.SAND, label: 'Sand (Glass)' },
              { block: BlockType.COBBLESTONE, label: 'Cobblestone' },
              { block: BlockType.WOOD_OAK, label: 'Oak Log' },
            ].map((mat, i) => (
              <button
                key={i}
                onClick={() => handleSetInput(mat.block)}
                className="flex items-center gap-1 rounded border border-[#373737] bg-[#a8a8a8] px-2 py-1 text-[10px] font-bold text-[#222] hover:bg-[#b8b8b8] active:translate-y-0.5"
              >
                <div
                  className="h-3 w-3 rounded-[1px]"
                  style={{ backgroundColor: BLOCK_DEFS[mat.block]?.iconColor }}
                />
                <span>{mat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t-2 border-[#373737] pt-2 text-[11px] text-[#404040]">
          <span>Outputs deposit into Hotbar Slot {selectedSlot + 1}</span>
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
