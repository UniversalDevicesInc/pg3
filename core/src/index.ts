import type { MqttMessage, DBNodeServer } from '@pg3/interfaces'

const message: MqttMessage = {
  type: 'Abc123',
  payload: { test: 123 }
}
