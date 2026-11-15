import React, { useState } from 'react';
import { DEFAULT_MINECRAFT_SKINS, MinecraftSkinDef } from '../game/skins';
import { soundFX } from '../game/audio';
import { X, Check } from 'lucide-react';

interface SkinSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentSkin: string;
  onSave: (name: string, skin: string) => void;
}

export const SkinSelector: React.FC<SkinSelectorProps> = ({
  isOpen,
  onClose,
  currentName,
  currentSkin,
  onSave,
}) => {
  const [name, setName] = useState(currentName);
  const [selectedSkin, setSelectedSkin] = useState(currentSkin);

  if (!isOpen) return null;

  const skinsList = Object.values(DEFAULT_MINECRAFT_SKINS);

  const handleSelect = (skinId: string) => {
    setSelectedSkin(skinId);
    soundFX.playPop();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim().slice(0, 16) || 'Steve';
    onSave(cleanName, selectedSkin);
    soundFX.playPlace('wood');
    onClose();
  };

  const activeSkinDef = DEFAULT_MINECRAFT_SKINS[selectedSkin] || DEFAULT_MINECRAFT_SKINS.steve;

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-[2px] p-4 font-mono select-none">
      <div className="relative flex w-full max-w-2xl flex-col rounded-lg border-4 border-[#373737] bg-[#c6c6c6] p-4 shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all transform scale-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Minecraft Style Oak Top Banner (matches user screenshot) */}
        <div className="relative mb-3 flex items-center justify-between rounded border-2 border-[#1e2f1e] bg-[#2d402d] px-4 py-2.5 shadow-md">
          <div className="flex items-center gap-2">
            <span
              className="text-xl sm:text-2xl font-bold tracking-wider text-white drop-shadow-[2px_2px_0px_#111111]"
              style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
            >
              Default Minecraft Characters
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded border-2 border-[#1a1a1a] bg-[#8b8b8b] text-white hover:bg-[#a0a0a0] active:translate-y-0.5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form & Skin Grid */}
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {/* Username Input */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 rounded border-2 border-[#373737] bg-[#8b8b8b] p-2 text-xs">
            <label className="font-bold text-white drop-shadow-[1px_1px_0px_#222]">
              PLAYER USERNAME:
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              placeholder="Steve"
              className="w-full sm:w-64 rounded border-2 border-[#373737] bg-[#ffffff] px-2.5 py-1 text-xs font-bold text-black focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* 9 Characters Display (Matching screenshot 4 + 5 layout) */}
          <div className="rounded border-2 border-[#373737] bg-[#d0ab7a] p-3 shadow-inner">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
              {skinsList.map((skin) => {
                const isSelected = selectedSkin === skin.id;

                return (
                  <button
                    key={skin.id}
                    type="button"
                    onClick={() => handleSelect(skin.id)}
                    className={`group relative flex flex-col items-center justify-between rounded-md border-2 p-2 transition-all ${
                      isSelected
                        ? 'border-white bg-[#ffffff]/35 shadow-[0_0_10px_rgba(255,255,255,0.8)] scale-105'
                        : 'border-[#8f6d48] bg-[#dfbf92]/50 hover:bg-[#dfbf92]/80 hover:scale-102'
                    }`}
                  >
                    {/* Character Voxel Silhouette Preview */}
                    <div className="relative flex flex-col items-center justify-center h-28 w-16">
                      {/* Hair & Head */}
                      <div
                        className="relative h-9 w-9 rounded-sm border border-black/30 shadow-md flex items-center justify-center"
                        style={{ backgroundColor: skin.skinTone }}
                      >
                        {/* Hair Cap */}
                        <div
                          className="absolute top-0 inset-x-0 h-3 rounded-t-sm"
                          style={{ backgroundColor: skin.hairColor }}
                        />
                        {/* Eyes */}
                        <div className="absolute top-4 flex justify-between w-6">
                          <div
                            className="h-1.5 w-1.5 rounded-[1px]"
                            style={{ backgroundColor: skin.eyeColor }}
                          />
                          <div
                            className="h-1.5 w-1.5 rounded-[1px]"
                            style={{ backgroundColor: skin.eyeColor }}
                          />
                        </div>
                      </div>

                      {/* Torso & Arms */}
                      <div className="relative mt-0.5 flex items-center justify-center">
                        {/* Left Arm */}
                        <div
                          className={`h-11 rounded-sm border border-black/20 ${skin.isSlim ? 'w-2' : 'w-2.5'}`}
                          style={{ backgroundColor: skin.shirtColor }}
                        />
                        {/* Body */}
                        <div
                          className="h-11 w-6 rounded-sm border border-black/30 shadow-sm"
                          style={{ backgroundColor: skin.shirtColor }}
                        />
                        {/* Right Arm */}
                        <div
                          className={`h-11 rounded-sm border border-black/20 ${skin.isSlim ? 'w-2' : 'w-2.5'}`}
                          style={{ backgroundColor: skin.shirtColor }}
                        />
                      </div>

                      {/* Legs & Shoes */}
                      <div className="mt-0.5 flex gap-0.5">
                        <div
                          className="h-10 w-3 rounded-sm border border-black/30 flex flex-col justify-end"
                          style={{ backgroundColor: skin.pantsColor }}
                        >
                          <div className="h-3 w-full rounded-b-sm" style={{ backgroundColor: skin.shoesColor }} />
                        </div>
                        <div
                          className="h-10 w-3 rounded-sm border border-black/30 flex flex-col justify-end"
                          style={{ backgroundColor: skin.pantsColor }}
                        >
                          <div className="h-3 w-full rounded-b-sm" style={{ backgroundColor: skin.shoesColor }} />
                        </div>
                      </div>

                      {/* Selected checkmark badge */}
                      {isSelected && (
                        <div className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white shadow">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>

                    {/* Character Name in Minecraft text style */}
                    <span
                      className="mt-1 text-xs font-bold text-[#1f1a14] drop-shadow-[1px_1px_0px_#ffffff]"
                      style={{ fontFamily: '"Silkscreen", "VT323", monospace' }}
                    >
                      {skin.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Skin Info Box */}
          <div className="flex items-center justify-between rounded border-2 border-[#373737] bg-[#8b8b8b] px-3 py-2 text-xs text-white">
            <div>
              <span className="font-bold text-amber-300">{activeSkinDef.name}</span>: {activeSkinDef.description}
            </div>
            {activeSkinDef.isSlim && (
              <span className="rounded bg-[#555] px-1.5 py-0.5 text-[10px] text-neutral-300">
                Slim Model
              </span>
            )}
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-2 border-t-2 border-[#373737] pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded border-2 border-[#373737] bg-[#8b8b8b] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#999999] active:translate-y-0.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded border-2 border-[#2b5e2b] bg-[#438a43] px-6 py-1.5 text-xs font-bold text-white hover:bg-[#52a852] drop-shadow-[1px_1px_0px_#111] active:translate-y-0.5"
            >
              Equip Skin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
