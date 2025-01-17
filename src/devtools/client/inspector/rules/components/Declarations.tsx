import React, { FC } from "react";
import { Declaration } from "devtools/client/inspector/rules/components/Declaration";
import { DeclarationState } from "../reducers/rules";

type DeclarationsProps = {
  declarations: DeclarationState[];
  query: string;
};

export const Declarations: FC<DeclarationsProps> = ({ declarations, query }) => {
  if (declarations.length === 0) {
    return null;
  }

  return (
    <ul className="ruleview-propertylist">
      {declarations.map(declaration => (
        <Declaration key={declaration.id} declaration={declaration} query={query} />
      ))}
    </ul>
  );
};
