import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind CSSクラスをマージするユーティリティ関数
 *
 * clsxとtailwind-mergeを組み合わせて、条件付きクラスと
 * Tailwindクラスの競合解決を同時に処理。
 *
 * @param inputs - クラス名または条件付きクラスオブジェクト
 * @returns マージされたクラス名文字列
 *
 * @example
 * cn('px-2 py-1', 'bg-blue-500') // "px-2 py-1 bg-blue-500"
 * cn('px-2', isActive && 'bg-blue-500') // "px-2 bg-blue-500" (isActiveがtrueの場合)
 * cn('p-2', 'px-4') // "py-2 px-4" (pxがpより優先)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
