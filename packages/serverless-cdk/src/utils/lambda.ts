import { Duration, Size } from 'aws-cdk-lib';
import {
  Architecture,
  Code,
  FunctionProps,
  Function as LambdaFunction,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { spawnSync } from 'child_process';
import { Construct } from 'constructs';

export function lambda(
  scope: Construct,
  handlerName: string,
  handlerDir: string,
  props?: Partial<FunctionProps>
): LambdaFunction {
  spawnSync('npm', ['install'], { cwd: handlerDir });
  return new LambdaFunction(scope, handlerName, {
    runtime: props?.runtime ?? Runtime.NODEJS_18_X,
    handler: `${handlerName}.handler`,
    code: Code.fromAsset(handlerDir),
    memorySize: props?.memorySize ?? Size.gibibytes(1).toMebibytes(),
    architecture: props?.architecture ?? Architecture.ARM_64,
    logRetention: props?.logRetention ?? RetentionDays.ONE_MONTH,
    timeout: props?.timeout ?? Duration.seconds(5),
    environment: props?.environment,
  });
}
