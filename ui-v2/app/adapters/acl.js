import Adapter, { DATACENTER_QUERY_PARAM as API_DATACENTER_KEY } from './application';
import { get } from '@ember/object';
import { SLUG_KEY } from 'consul-ui/models/acl';
import { FOREIGN_KEY as DATACENTER_KEY } from 'consul-ui/models/dc';

export default Adapter.extend({
  requestForQuery: function(request, { dc, index }) {
    // https://www.consul.io/api/acl.html#list-acls
    return request`
      GET /v1/acl/list?${{ dc }}

      ${{ index }}
    `;
  },
  requestForQueryRecord: function(request, { dc, index, id }) {
    if (typeof id === 'undefined') {
      throw new Error('You must specify an id');
    }
    // https://www.consul.io/api/acl.html#read-acl-token
    return request`
      GET /v1/acl/info/${id}?${{ dc }}

      ${{ index }}
    `;
  },
  requestForCreateRecord: function(request, serialized, data) {
    // https://www.consul.io/api/acl.html#create-acl-token
    return request`
      PUT /v1/acl/create?${{ [API_DATACENTER_KEY]: data[DATACENTER_KEY] }}

      ${serialized}
    `;
  },
  requestForUpdateRecord: function(request, serialized, data) {
    // the id is in the data, don't add it in here
    // https://www.consul.io/api/acl.html#update-acl-token
    return request`
      PUT /v1/acl/update?${{ [API_DATACENTER_KEY]: data[DATACENTER_KEY] }}

      ${serialized}
    `;
  },
  requestForDeleteRecord: function(request, serialized, data) {
    // https://www.consul.io/api/acl.html#delete-acl-token
    return request`
      PUT /v1/acl/destroy/${data[SLUG_KEY]}?${{ [API_DATACENTER_KEY]: data[DATACENTER_KEY] }}
    `;
  },
  requestForCloneRecord: function(request, serialized, data) {
    // https://www.consul.io/api/acl.html#clone-acl-token
    return request`
      PUT /v1/acl/clone/${data[SLUG_KEY]}?${{ [API_DATACENTER_KEY]: data[DATACENTER_KEY] }}
    `;
  },
  clone: function(store, type, id, snapshot) {
    const serializer = store.serializerFor(type.modelName);
    const unserialized = this.snapshotToJSON(snapshot, type);
    const serialized = serializer.serialize(snapshot, {});
    return get(this, 'client')
      .request(request => this.requestForClone(request, serialized, unserialized))
      .then(respond => serializer.respondForQueryRecord(respond, unserialized));
  },
});
