import React from "react";

const JsonView = ({ data }) => {
  if (!data || !data.data) return null;

  return (
    <div className="bg-gray-900 rounded-lg p-3">
      <pre className="text-gray-100 text-xs overflow-x-auto">
        {JSON.stringify(data.data, null, 2)}
      </pre>
    </div>
  );
};

export default JsonView;
