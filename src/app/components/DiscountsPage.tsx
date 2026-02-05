import { useState, useEffect } from "react";
import { Save, AlertCircle, Percent, Package } from "lucide-react";
import { toast } from "sonner";
import { getDiscountSettings, updateDiscountSettings } from "../../utils/api";

export function DiscountsPage() {
  const [settings, setSettings] = useState({
    wholesaleMinUnits: 5,
    discountType: "percentage" as "percentage" | "fixed_amount",
    wholesaleDiscountPercent: 1,
    wholesaleDiscountAmount: 0,
  });
  const [originalSettings, setOriginalSettings] = useState({
    wholesaleMinUnits: 5,
    discountType: "percentage" as "percentage" | "fixed_amount",
    wholesaleDiscountPercent: 1,
    wholesaleDiscountAmount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getDiscountSettings();
      setSettings({
        wholesaleMinUnits: data.wholesaleMinUnits,
        discountType: data.discountType,
        wholesaleDiscountPercent: data.wholesaleDiscountPercent,
        wholesaleDiscountAmount: data.wholesaleDiscountAmount || 0,
      });
      setOriginalSettings({
        wholesaleMinUnits: data.wholesaleMinUnits,
        discountType: data.discountType,
        wholesaleDiscountPercent: data.wholesaleDiscountPercent,
        wholesaleDiscountAmount: data.wholesaleDiscountAmount || 0,
      });
    } catch (error) {
      console.error("Error loading discount settings:", error);
      toast.error("Failed to load discount settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof settings, value: any) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);

    const changed =
      newSettings.wholesaleMinUnits !== originalSettings.wholesaleMinUnits ||
      newSettings.discountType !== originalSettings.discountType ||
      newSettings.wholesaleDiscountPercent !==
        originalSettings.wholesaleDiscountPercent ||
      newSettings.wholesaleDiscountAmount !==
        originalSettings.wholesaleDiscountAmount;
    setHasChanges(changed);
  };

  const handleSave = async () => {
    if (settings.wholesaleMinUnits < 1) {
      toast.error("Minimum units must be at least 1");
      return;
    }

    if (settings.wholesaleMinUnits > 1000) {
      toast.error("Minimum units cannot exceed 1000");
      return;
    }

    if (settings.discountType === "percentage") {
      if (settings.wholesaleDiscountPercent < 0) {
        toast.error("Discount percentage cannot be negative");
        return;
      }
      if (settings.wholesaleDiscountPercent > 100) {
        toast.error("Discount percentage cannot exceed 100%");
        return;
      }
    } else {
      if (settings.wholesaleDiscountAmount < 0) {
        toast.error("Discount amount cannot be negative");
        return;
      }
    }

    try {
      setSaving(true);
      await updateDiscountSettings({
        wholesaleMinUnits: settings.wholesaleMinUnits,
        discountType: settings.discountType,
        wholesaleDiscountPercent: settings.wholesaleDiscountPercent,
        wholesaleDiscountAmount: settings.wholesaleDiscountAmount,
      });

      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success("Discount settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update discount settings");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setHasChanges(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const exampleOrderTotal = 1000;
  const discountAmount =
    settings.discountType === "percentage"
      ? (settings.wholesaleDiscountPercent / 100) * exampleOrderTotal
      : settings.wholesaleDiscountAmount;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Discount Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure wholesale and retail discount parameters
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">How it works:</p>
          <p className="mt-1">
            When the total quantity of items in an order reaches the minimum
            units threshold, the entire order is classified as wholesale and
            receives the configured discount.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <label
              htmlFor="minUnits"
              className="block text-sm font-medium text-gray-900 mb-2"
            >
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-red-600" />
                Minimum Units for Wholesale
              </div>
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Orders with total items equal to or greater than this will be
              classified as wholesale
            </p>
            <div className="flex items-center gap-3">
              <input
                id="minUnits"
                type="number"
                min="1"
                max="1000"
                step="1"
                value={settings.wholesaleMinUnits}
                onChange={(e) =>
                  handleChange(
                    "wholesaleMinUnits",
                    parseInt(e.target.value) || 1,
                  )
                }
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-32"
              />
              <span className="text-gray-600 font-medium">units</span>
            </div>
            <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-700">
              <p>
                <strong>Current:</strong> Orders with{" "}
                <strong>{settings.wholesaleMinUnits} or more units</strong>{" "}
                qualify as wholesale
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-900 mb-4">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-red-600" />
                Discount Type
              </div>
            </label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={settings.discountType === "percentage"}
                  onChange={() => handleChange("discountType", "percentage")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  Percentage Discount
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="fixed_amount"
                  checked={settings.discountType === "fixed_amount"}
                  onChange={() => handleChange("discountType", "fixed_amount")}
                  className="w-4 h-4 text-red-600 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  Fixed Amount Discount
                </span>
              </label>
            </div>

            {settings.discountType === "percentage" && (
              <div>
                <label
                  htmlFor="discountPercent"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Discount Percentage
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  The percentage of the order total to discount
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={settings.wholesaleDiscountPercent}
                    onChange={(e) =>
                      handleChange(
                        "wholesaleDiscountPercent",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-32"
                  />
                  <span className="text-gray-600 font-medium">%</span>
                </div>
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                  <p>
                    <strong>Current:</strong>{" "}
                    <strong>
                      {settings.wholesaleDiscountPercent}% discount
                    </strong>{" "}
                    applied to wholesale orders
                  </p>
                </div>
              </div>
            )}

            {settings.discountType === "fixed_amount" && (
              <div>
                <label
                  htmlFor="discountAmount"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Fixed Discount Amount
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  The fixed amount (in ₱) to deduct from the order total
                </p>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-gray-600 font-medium">₱</span>
                  <input
                    id="discountAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.wholesaleDiscountAmount}
                    onChange={(e) =>
                      handleChange(
                        "wholesaleDiscountAmount",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-32"
                  />
                </div>
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                  <p>
                    <strong>Current:</strong>{" "}
                    <strong>
                      ₱{settings.wholesaleDiscountAmount.toFixed(2)} discount
                    </strong>{" "}
                    applied to wholesale orders
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Example Calculation
            </h3>
            <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 space-y-2 text-sm">
              <p>
                <span className="text-gray-600">
                  Order with 10 items totaling ₱
                  {exampleOrderTotal.toLocaleString()}:
                </span>
              </p>
              <ul className="space-y-1 ml-4 text-gray-700">
                <li>
                  ✓ Qualifies as wholesale:{" "}
                  {10 >= settings.wholesaleMinUnits ? "Yes" : "No"}
                </li>
                <li>💰 Discount amount: ₱{discountAmount.toFixed(2)}</li>
                <li>
                  📊 Final price: ₱
                  {(exampleOrderTotal - discountAmount).toFixed(2)}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Reset
          </button>
        </div>

        {hasChanges && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              You have unsaved changes. Click "Save Changes" to apply them.
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          These settings affect all wholesale pricing calculations in the Point
          of Sale system
        </p>
      </div>
    </div>
  );
}
