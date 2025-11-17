import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CategoricalAnalysisData {
  type: 'categorical_analysis';
  summary?: string;
  dataset_preview?: any[];
  column_types?: {
    categorical?: string[];
  };
  analysis?: {
    value_counts?: Record<string, Record<string, number>>;
    missing_values?: Record<string, number>;
  };
  plots?: Record<string, string>;
}

interface CategoricalAnalysisProps {
  data: CategoricalAnalysisData;
}

export const CategoricalAnalysisDisplay = ({ data }: CategoricalAnalysisProps) => {
  return (
    <div className="space-y-4 w-full">
      {/* Column Types */}
      {data.column_types?.categorical && data.column_types.categorical.length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               Column Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <h4 className="text-sm font-semibold mb-2 text-gray-200">Categorical Columns:</h4>
              <div className="flex flex-wrap gap-2">
                {data.column_types.categorical.map((col, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {col}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Preview */}
      {data.dataset_preview && data.dataset_preview.length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               Dataset Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    {Object.keys(data.dataset_preview[0] || {}).map((key, idx) => (
                      <th key={idx} className="text-left p-2 font-semibold text-gray-200">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.dataset_preview.slice(0, 5).map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-gray-800">
                      {Object.values(row).map((val: any, colIdx) => (
                        <td key={colIdx} className="p-2 text-gray-300">
                          {String(val)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Value Counts */}
      {data.analysis?.value_counts && Object.keys(data.analysis.value_counts).length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               Value Counts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.analysis.value_counts).map(([key, values]) => (
                <div key={key}>
                  <h4 className="text-sm font-semibold mb-2 text-gray-200">{key.replace('_counts', '')}:</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-2 text-gray-200">Value</th>
                          <th className="text-right p-2 text-gray-200">Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(values).slice(0, 10).map(([val, count], idx) => (
                          <tr key={idx} className="border-b border-gray-800">
                            <td className="p-2 text-gray-300">{val}</td>
                            <td className="p-2 text-right text-gray-300">{count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Values */}
      {data.analysis?.missing_values && Object.keys(data.analysis.missing_values).length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               Missing Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2 text-gray-200">Column</th>
                    <th className="text-right p-2 text-gray-200">Missing Count</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.analysis.missing_values).map(([col, count], idx) => (
                    <tr key={idx} className="border-b border-gray-800">
                      <td className="p-2 text-gray-300">{col}</td>
                      <td className="p-2 text-right text-gray-300">{count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plots */}
      {data.plots && Object.keys(data.plots).length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
               Visualizations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(data.plots).map(([key, base64]) => (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-200 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  <img
                    src={`data:image/png;base64,${base64}`}
                    alt={key}
                    className="w-full rounded-lg border border-gray-700"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {data.summary && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-300 leading-relaxed">{data.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
