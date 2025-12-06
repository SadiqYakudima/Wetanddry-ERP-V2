import React from 'react';
import { getRecipes, createProductionRun, seedRecipes } from '@/lib/actions/production';
import { Factory, Play, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default async function ProductionPage() {
    const recipes = await getRecipes();

    // Temporary: Auto-seed if empty
    if (recipes.length === 0) {
        await seedRecipes();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Production & Mixology</h1>
                    <p className="text-gray-600 mt-1">Manage recipes and execute production runs</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recipe Selection & Execution */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Factory className="text-blue-600" />
                            Start Production Run
                        </h2>

                        <form action={createProductionRun} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Recipe
                                </label>
                                <select
                                    name="recipeId"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Choose a recipe...</option>
                                    {recipes.map(recipe => (
                                        <option key={recipe.id} value={recipe.id}>{recipe.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity to Produce (m³)
                                </label>
                                <input
                                    name="quantity"
                                    type="number"
                                    step="0.1"
                                    min="0.1"
                                    placeholder="e.g., 5.0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                                <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                                <div className="text-sm text-blue-800">
                                    <span className="font-semibold">Note:</span> Starting production will automatically deduct required raw materials from the inventory based on the selected recipe.
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                            >
                                <Play size={20} />
                                Execute Production
                            </button>
                        </form>
                    </div>

                    {/* Recent Runs (Placeholder) */}
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Recent Production Runs</h3>
                        </div>
                        <div className="p-6 text-center text-gray-500">
                            No recent runs found.
                        </div>
                    </div>
                </div>

                {/* Recipe Details Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Recipes</h3>
                        <div className="space-y-4">
                            {recipes.map(recipe => (
                                <div key={recipe.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                    <div className="font-medium text-gray-900">{recipe.name}</div>
                                    <p className="text-sm text-gray-500 mb-3">{recipe.description}</p>
                                    <div className="text-xs font-semibold text-gray-600 uppercase mb-2">Ingredients per m³:</div>
                                    <ul className="space-y-1">
                                        {recipe.ingredients.map(ing => (
                                            <li key={ing.id} className="text-sm text-gray-700 flex justify-between">
                                                <span>{ing.materialName}</span>
                                                <span className="font-medium">{ing.quantity} {ing.unit}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
