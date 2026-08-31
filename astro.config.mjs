import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://spike.tue.nl',
  redirects: {
    '/getting-started/': '/start-here/',
    '/running-jobs/containers/': '/images/podman-harbor/',
    '/running-jobs/training/': '/workloads/training/',
    '/running-jobs/terminal-access/': '/access/terminal/',
    '/running-jobs/slurm/': '/advanced/slurm-reference/',
    '/storage/filesystems/': '/storage/data/',
    '/software/modules/': '/advanced/',
    '/advanced/hosted-models/': '/llm-hosting/',
  },
  integrations: [
    starlight({
      title: 'Spike Documentation',
      description: 'Practical guidance for running research workloads on Spike.',
      disable404Route: true,
      customCss: ['./src/styles/tokens.css', './src/styles/custom.css'],
      components: {
        Head: './src/components/Head.astro',
      },
      sidebar: [
        {
          label: 'Getting started',
          items: [
            { slug: 'start-here' },
            { slug: 'start-here/intake' },
            { slug: 'start-here/data-classification' },
            { slug: 'start-here/essential-practices' },
            { slug: 'start-here/monitoring-and-profiling' },
          ],
        },
        {
          label: 'Access & connectivity',
          items: [{ slug: 'access/accounts' }, { slug: 'access/cli' }, { slug: 'access/terminal' }],
        },
        {
          label: 'Images & environments',
          items: [{ slug: 'images/podman-harbor' }],
        },
        {
          label: 'Running workloads',
          items: [{ slug: 'workloads/training' }, { slug: 'workloads/inference' }, { slug: 'workloads/lifecycle' }],
        },
        {
          label: 'Storage & data',
          items: [{ slug: 'storage/data' }, { slug: 'storage/file-transfer' }],
        },
        {
          label: 'LLM hosting',
          items: [{ slug: 'llm-hosting', label: 'Current service and access' }],
        },
        {
          label: 'Advanced & experimental',
          items: [
            { slug: 'advanced' },
            { slug: 'advanced/runai-cli' },
            { slug: 'advanced/accelerate' },
            { slug: 'advanced/multi-gpu' },
            { slug: 'advanced/experiment-tracking' },
            { slug: 'advanced/benchmarks' },
            { slug: 'advanced/slurm-reference' },
          ],
        },
        {
          label: 'Performance optimization',
          items: [
            {
              label: 'Beginner',
              items: [
                { slug: 'optimilization/beginner/loading/data', label: 'Efficient data loading' },
                { slug: 'optimilization/beginner/synchronization/data', label: 'CPU and GPU synchronization' },
                { slug: 'optimilization/beginner/contraction/data', label: 'Tensor contractions' },
                { slug: 'optimilization/beginner/fractioning/data', label: 'Workload fractioning' },
              ],
            },
            {
              label: 'Advanced',
              items: [
                { slug: 'optimilization/advanced/loading/data', label: 'Advanced data loading' },
                { slug: 'optimilization/advanced/distribution/data', label: 'Distributed graph operations' },
              ],
            },
          ],
        },
        { label: 'About Spike', items: [{ slug: 'publications' }] },
        { label: 'Help', items: [{ slug: 'troubleshooting' }, { slug: 'support' }] },
      ],
    }),
  ],
});
