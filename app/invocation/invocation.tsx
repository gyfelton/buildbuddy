import React from 'react';
import Long from 'long';
import moment from 'moment';

import rpcService from '../service/rpc_service'

import InvocationModel from './invocation_model'

import InvocationLoadingComponent from './invocation_loading'
import InvocationInProgressComponent from './invocation_in_progress'
import InvocationNotFoundComponent from './invocation_not_found'

import InvocationOverviewComponent from './invocation_overview'
import InvocationTabsComponent from './invocation_tabs';
import BuildLogsCardComponent from './build_logs_card'
import ErrorCardComponent from './error_card';
import FailedTargetsCardComponent from './failed_targets_card'
import InvocationDetailsCardComponent from './invocation_details_card'
import ArtifactsCardComponent from './artifacts_card'
import RawLogsCardComponent from './raw_logs_card'
import SucceededTargetsCardComponent from './succeeded_targets_card'

import { invocation } from '../../proto/invocation_ts_proto';

interface State {
  loading: boolean,
  inProgress: boolean,
  notFound: boolean,

  model: InvocationModel,
}

interface Props {
  invocationId: string,
  hash: string
}

export default class InvocationComponent extends React.Component {
  state: State = {
    loading: true,
    inProgress: false,
    notFound: false,

    model: new InvocationModel(),
  };

  props: Props;

  componentWillMount() {
    // TODO(siggisim): Move moment configuration elsewhere
    moment.relativeTimeThreshold('ss', 0);

    let request = new invocation.GetInvocationRequest();
    request.query = new invocation.InvocationQuery();
    request.query.invocationId = this.props.invocationId;
    rpcService.service.getInvocation(request).then((response) => {
      console.log(response);
      this.setState({
        model: InvocationModel.modelFromInvocations(response.invocation as invocation.Invocation[]),
        loading: false
      });
    }).catch((error: any) => {
      this.setState({
        notFound: true,
        loading: false
      });
    });
  }

  render() {
    if (this.state.loading) {
      return <InvocationLoadingComponent invocationId={this.props.invocationId} />;
    }

    if (this.state.notFound) {
      return <InvocationNotFoundComponent invocationId={this.props.invocationId} />;
    }

    if (this.state.inProgress) {
      return <InvocationInProgressComponent invocationId={this.props.invocationId} />;
    }

    return (
      <div>
        <div className="shelf">
          <InvocationOverviewComponent invocationId={this.props.invocationId} model={this.state.model} />
        </div>
        <div className="container">
          <InvocationTabsComponent hash={this.props.hash} />

          {(!this.props.hash || this.props.hash == "#log") &&
            <BuildLogsCardComponent model={this.state.model} expanded={this.props.hash == "#log"} />}

          {(!this.props.hash || this.props.hash == "#log") &&
            this.state.model.aborted?.aborted.description &&
            <ErrorCardComponent model={this.state.model} />}

          {(!this.props.hash || this.props.hash == "#targets") &&
            !!this.state.model.failed.length &&
            <FailedTargetsCardComponent model={this.state.model} limitResults={!this.props.hash} />}

          {(!this.props.hash || this.props.hash == "#targets") &&
            !!this.state.model.succeeded.length &&
            <SucceededTargetsCardComponent model={this.state.model} limitResults={!this.props.hash} />}

          {(!this.props.hash || this.props.hash == "#details") &&
            <InvocationDetailsCardComponent model={this.state.model} limitResults={!this.props.hash} />}

          {(!this.props.hash || this.props.hash == "#artifacts") &&
            <ArtifactsCardComponent model={this.state.model} limitResults={!this.props.hash} />}

          {(this.props.hash == "#raw") && <RawLogsCardComponent model={this.state.model} />}
        </div>
      </div>
    );
  }
}
