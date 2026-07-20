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
  },
  integrations: [
    starlight({
      title: 'Spike Documentation',
      description: 'Practical guidance for running research workloads on Spike.',
      disable404Route: true,
      customCss: ['./src/styles/tokens.css', './src/styles/custom.css'],
      sidebar: [
        {
          label: 'Start here',
          items: [{ slug: 'start-here' }, { slug: 'reference/glossary' }],
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
          items: [{ slug: 'workloads/training' }, { slug: 'workloads/interactive' }, { slug: 'workloads/inference' }, { slug: 'workloads/lifecycle' }],
        },
        {
          label: 'Storage & data',
          items: [{ slug: 'storage/data' }],
        },
        {
          label: 'Advanced & experimental',
          items: [
            { slug: 'advanced' },
            { slug: 'advanced/accelerate' },
            { slug: 'advanced/multi-gpu' },
            { slug: 'advanced/experiment-tracking' },
            { slug: 'advanced/benchmarks' },
            { slug: 'advanced/hosted-models' },
            { slug: 'advanced/slurm-reference' },
          ],
        },
        { label: 'Help', items: [{ slug: 'troubleshooting' }, { slug: 'support' }] },
      ],
    }),
  ],
});
