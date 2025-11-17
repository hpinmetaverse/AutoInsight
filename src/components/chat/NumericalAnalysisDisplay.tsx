import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface NumericalAnalysisProps {
  data: {
    type: 'numerical_analysis';
    summary: string;
    dataset_preview?: any[];
    column_types?: { numerical: string[] };
    analysis?: {
      summary_stats?: any;
      missing_values?: Record<string, number>;
      correlation_matrix?: any;
      outliers?: Record<string, number>;
    };
    plots?: Record<string, string>;
  };
}

export const NumericalAnalysisDisplay = ({ data }: NumericalAnalysisProps) => {
  return (
    <div className="space-y-4 w-full">

      {/* Column Types */}
      {data.column_types?.numerical && data.column_types.numerical.length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Numerical Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.column_types.numerical.map((col, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {col}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dataset Preview */}
      {data.dataset_preview && data.dataset_preview.length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Dataset Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(data.dataset_preview[0]).map((key) => (
                      <TableHead key={key} className="text-gray-300">{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.dataset_preview.map((row, idx) => (
                    <TableRow key={idx}>
                      {Object.values(row).map((val: any, cellIdx) => (
                        <TableCell key={cellIdx} className="text-gray-400">
                          {typeof val === 'number' ? val.toFixed(2) : String(val)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      {data.analysis?.summary_stats && Object.keys(data.analysis.summary_stats).length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-300">Metric</TableHead>
                    {Object.keys(data.analysis.summary_stats).map((col) => (
                      <TableHead key={col} className="text-gray-300">{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['count', 'mean', 'std', 'min', '25%', '50%', '75%', 'max'].map((stat) => (
                    <TableRow key={stat}>
                      <TableCell className="font-medium text-gray-300">{stat}</TableCell>
                      {Object.keys(data.analysis.summary_stats).map((col) => (
                        <TableCell key={col} className="text-gray-400">
                          {typeof data.analysis.summary_stats[col][stat] === 'number'
                            ? data.analysis.summary_stats[col][stat].toFixed(2)
                            : data.analysis.summary_stats[col][stat]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Values & Outliers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.analysis?.missing_values && (
          <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg">Missing Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.analysis.missing_values).map(([col, count]) => (
                  <div key={col} className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{col}</span>
                    <Badge variant={count > 0 ? 'destructive' : 'secondary'} className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {data.analysis?.outliers && (
          <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
            <CardHeader>
              <CardTitle className="text-lg">Outliers Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(data.analysis.outliers).map(([col, count]) => (
                  <div key={col} className="flex justify-between items-center">
                    <span className="text-sm text-gray-300">{col}</span>
                    <Badge variant={count > 0 ? 'destructive' : 'secondary'} className="text-xs">
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Plots */}
      {data.plots && Object.keys(data.plots).length > 0 && (
        <Card className="bg-gradient-to-b from-zinc-800 to-zinc-900">
          <CardHeader>
            <CardTitle className="text-lg">Visualizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 " >
              {Object.entries(data.plots).map(([name, base64]) => (
                <div key={name} className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300 capitalize">
                    {name.replace(/_/g, ' ')}
                  </h4>
                  <img
                    src={`data:image/png;base64,${base64}`}
                    alt={name}
                    className="w-full rounded-lg border border-border"
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
