/**
 * Sample file A - demonstrates various import/export patterns
 */

import { useState, useEffect } from 'react';
import React from 'react';
import * as utils from './utils';
import { SampleB } from './sample-b';
import config from './config.json';

// Dynamic import
const loadModule = async () => {
  const module = await import('./sample-c');
  return module.default;
};

// Conditional import
if (process.env.NODE_ENV === 'development') {
  const devTools = require('./dev-tools');
}

export interface SampleAProps {
  title: string;
  data: any[];
}

export class SampleA {
  private config = config;
  private utils = utils;

  constructor(private props: SampleAProps) {}

  render() {
    return React.createElement('div', { className: 'sample-a' }, this.props.title);
  }

  async loadData() {
    const loader = await loadModule();
    return loader.getData();
  }

  processWithB() {
    const sampleB = new SampleB();
    return sampleB.process(this.props.data);
  }
}

export default SampleA;
export const VERSION = '1.0.0';